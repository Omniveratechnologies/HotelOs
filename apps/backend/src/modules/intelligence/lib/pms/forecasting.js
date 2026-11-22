// Pure-JS forecasting engine (no external services needed).
// Model: additive Holt-Winters (level + trend + weekly seasonality) with a grid-searched
// smoothing setup and empirical prediction intervals from one-step-ahead residuals.
// Falls back to a seasonal-naive/mean model when history is short.

const SEASON = 7;

function fitHW(y, alpha, beta, gamma, m = SEASON) {
  const n = y.length;
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const first = mean(y.slice(0, m));
  const second = mean(y.slice(m, 2 * m));
  let level = first;
  let trend = (second - first) / m;
  const season = Array.from({ length: m }, (_, i) => y[i] - first);
  const fitted = [];
  let sse = 0;
  for (let t = 0; t < n; t++) {
    const s = season[t % m];
    const pred = level + trend + s;
    fitted.push(pred);
    if (t >= m) sse += (y[t] - pred) ** 2;
    const prevLevel = level;
    level = alpha * (y[t] - s) + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    season[t % m] = gamma * (y[t] - level) + (1 - gamma) * s;
  }
  return { level, trend, season, fitted, sse, n };
}

function gridSearch(y) {
  let best = null;
  for (const a of [0.1, 0.2, 0.35, 0.5])
    for (const b of [0.01, 0.05])
      for (const g of [0.1, 0.25, 0.45]) {
        const fit = fitHW(y, a, b, g);
        if (!best || fit.sse < best.sse) best = { ...fit, a, b, g };
      }
  return best;
}

const z80 = 1.2816; // 80% interval, matches the 10th/90th quantile bands in the guide

/**
 * @param {number[]} history  daily values, oldest -> newest (no gaps)
 * @param {number} horizon    days ahead
 * @param {{min?:number,max?:number,damp?:number}} opts
 * @returns {{predicted:number[],lower:number[],upper:number[],model:string,mape:number|null}}
 */
export function forecastSeries(history, horizon, opts = {}) {
  const { min = 0, max = Infinity, damp = 0.94 } = opts;
  const clean = history.map((v) => (Number.isFinite(v) ? v : 0));
  const clamp = (v) => Math.min(max, Math.max(min, v));
  if (clean.length < 2 * SEASON + 1) {
    const avg = clean.length
      ? clean.reduce((s, v) => s + v, 0) / clean.length
      : 0;
    const sd =
      Math.sqrt(
        clean.reduce((s, v) => s + (v - avg) ** 2, 0) /
          Math.max(clean.length, 1),
      ) || avg * 0.15;
    return {
      predicted: Array(horizon).fill(clamp(avg)),
      lower: Array(horizon).fill(clamp(avg - z80 * sd)),
      upper: Array(horizon).fill(clamp(avg + z80 * sd)),
      model: "mean-baseline",
      mape: null,
    };
  }
  const fit = gridSearch(clean);
  const resid = fit.fitted.map((f, i) => clean[i] - f).slice(SEASON);
  const sigma = Math.sqrt(
    resid.reduce((s, r) => s + r * r, 0) / Math.max(resid.length, 1),
  );
  const predicted = [];
  const lower = [];
  const upper = [];
  let dampSum = 0;
  for (let h = 1; h <= horizon; h++) {
    dampSum += damp ** h; // damped trend keeps long horizons from running away
    const season = fit.season[(fit.n + h - 1) % SEASON];
    const point = fit.level + fit.trend * dampSum + season;
    const width = z80 * sigma * Math.sqrt(1 + (h - 1) * 0.04);
    predicted.push(clamp(point));
    lower.push(clamp(point - width));
    upper.push(clamp(point + width));
  }
  const nonZero = clean
    .slice(SEASON)
    .map((v, i) => [v, fit.fitted[i + SEASON]])
    .filter(([v]) => Math.abs(v) > 1e-9);
  const mape = nonZero.length
    ? (nonZero.reduce((s, [v, f]) => s + Math.abs((v - f) / v), 0) /
        nonZero.length) *
      100
    : null;
  return {
    predicted,
    lower,
    upper,
    model: `hw-add7(a=${fit.a},b=${fit.b},g=${fit.g})`,
    mape,
  };
}

/** Rolling-origin backtest: hold out `holdout` days, forecast them, report MAPE / bias. */
export function backtest(history, holdout = 14) {
  if (history.length < holdout + 2 * SEASON + 1) return null;
  const train = history.slice(0, -holdout);
  const actual = history.slice(-holdout);
  const { predicted } = forecastSeries(train, holdout, { min: -Infinity });
  const pairs = actual
    .map((a, i) => [a, predicted[i]])
    .filter(([a]) => Math.abs(a) > 1e-9);
  if (!pairs.length) return null;
  return {
    mape:
      (pairs.reduce((s, [a, p]) => s + Math.abs((a - p) / a), 0) /
        pairs.length) *
      100,
    bias: pairs.reduce((s, [a, p]) => s + (p - a), 0) / pairs.length,
  };
}

/** RevPAR stays consistent with ADR & occupancy: revpar = adr * occupancy/100 (bounds multiply too). */
export function deriveRevpar(adr, occ) {
  return {
    predicted: adr.predicted.map((v, i) => (v * occ.predicted[i]) / 100),
    lower: adr.lower.map((v, i) => (v * occ.lower[i]) / 100),
    upper: adr.upper.map((v, i) => (v * occ.upper[i]) / 100),
  };
}
