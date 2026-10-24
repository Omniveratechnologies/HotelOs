// Pure computation layer for Business Intelligence — combines PMS + POS numbers (and, for
// Profitability, cost data) the same way dashboard-shape.js / pos/shape.js do for their modules:
// live-data.js and demo-data.js both build the same "raw" shape and hand it here, so live and
// demo output are guaranteed structurally identical.
import { BI_DASHBOARDS } from "./intelligence-data.js";
import { forecastSeries } from "../pms/forecasting.js";

export const dayMs = 24 * 60 * 60 * 1000;
export const money = (v) => `₹${Math.round(v || 0).toLocaleString("en-IN")}`;
export const dateLabel = (date) =>
  `${date.getUTCDate()} ${date.toLocaleString("en", { month: "short", timeZone: "UTC" })}`;
export const rangeSize = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 };
export const colors = [
  "#1E6FEB",
  "#F59E0B",
  "#8B5CF6",
  "#10B981",
  "#EF4444",
  "#6b7cae",
];

export function dayKey(value) {
  return new Date(new Date(value).getTime() + 330 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

export function computeWindows(range, now = new Date()) {
  const days = rangeSize[range] || 30;
  const end = new Date(now);
  end.setUTCHours(0, 0, 0, 0);
  end.setUTCDate(end.getUTCDate() + 1);
  const selectedStart = new Date(end.getTime() - days * dayMs);
  const previousStart = new Date(selectedStart.getTime() - days * dayMs);
  return { days, end, selectedStart, previousStart };
}

export const pctChange = (current, previous) => {
  if (!previous) return current ? "+100.0%" : "0.0%";
  const v = ((current - previous) / previous) * 100;
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
};
const dash = (c, p) => (p == null ? "—" : pctChange(c, p));
const withColor = (rows) =>
  rows.map((r, i) => ({ ...r, color: colors[i % colors.length] }));
const seriesDay = (date) => ({ date: dayKey(date), day: dateLabel(date) });
const mapByDay = (days, selectedStart, fields) => {
  const m = new Map();
  for (let i = 0; i < days; i++) {
    const date = new Date(selectedStart.getTime() + i * dayMs);
    m.set(dayKey(date), { ...seriesDay(date), ...fields() });
  }
  return m;
};

// ---------------- 1. Total Revenue ----------------
export function computeTotalRevenue({ days, selectedStart }, raw) {
  const {
    pmsDailyRows,
    posDailyRows,
    otherDailyRows,
    previousPmsTotal,
    previousPosTotal,
    previousOtherTotal,
    pmsTxnCount,
    posTxnCount,
    previousTxnCount,
    paymentRowsPms,
    paymentRowsPos,
    outletRowsPos,
    pmsRevenueTotal,
    topCategories,
    topRoomTypes,
  } = raw;
  const byDay = mapByDay(days, selectedStart, () => ({
    pms: 0,
    pos: 0,
    other: 0,
    total: 0,
  }));
  for (const r of pmsDailyRows) {
    const b = byDay.get(dayKey(r._id));
    if (b) {
      b.pms = r.amount;
      b.total += r.amount;
    }
  }
  for (const r of posDailyRows) {
    const b = byDay.get(dayKey(r._id));
    if (b) {
      b.pos = r.amount;
      b.total += r.amount;
    }
  }
  for (const r of otherDailyRows) {
    const b = byDay.get(dayKey(r._id));
    if (b) {
      b.other = r.amount;
      b.total += r.amount;
    }
  }
  const series = [...byDay.values()];

  const pmsTotal = pmsDailyRows.reduce((s, r) => s + r.amount, 0);
  const posTotal = posDailyRows.reduce((s, r) => s + r.amount, 0);
  // "Other Revenue" = incidentals posted to the guest folio (minibar, laundry, spa) via the PMS
  // invoice system — distinct from the POS restaurant system's own order revenue.
  const otherTotal = otherDailyRows.reduce((s, r) => s + r.amount, 0);
  const total = pmsTotal + posTotal + otherTotal;
  const totalTxn = pmsTxnCount + posTxnCount;

  const metrics = [
    {
      label: "Total Revenue",
      icon: "IndianRupee",
      value: money(total),
      change: dash(
        total,
        (previousPmsTotal ?? 0) +
          (previousPosTotal ?? 0) +
          (previousOtherTotal ?? 0),
      ),
    },
    {
      label: "PMS Revenue (Rooms)",
      icon: "BedDouble",
      value: money(pmsTotal),
      change: dash(pmsTotal, previousPmsTotal),
    },
    {
      label: "POS Revenue (F&B)",
      icon: "ConciergeBell",
      value: money(posTotal),
      change: dash(posTotal, previousPosTotal),
    },
    {
      label: "Other Revenue",
      icon: "Boxes",
      value: money(otherTotal),
      change: dash(otherTotal, previousOtherTotal),
    },
    {
      label: "Total Transactions",
      icon: "ClipboardList",
      value: totalTxn.toLocaleString("en-IN"),
      change: dash(totalTxn, previousTxnCount),
    },
  ];

  const paymentMap = new Map();
  for (const r of [...paymentRowsPms, ...paymentRowsPos]) {
    const cur = paymentMap.get(r._id) || { name: r._id, amount: 0 };
    cur.amount += r.amount;
    paymentMap.set(r._id, cur);
  }

  return {
    metrics,
    series,
    revenueBySource: withColor([
      { name: "PMS (Rooms)", value: pmsTotal },
      { name: "POS (F&B)", value: posTotal },
      { name: "Other Revenue", value: otherTotal },
    ]),
    paymentMethods: withColor([...paymentMap.values()]),
    outlets: withColor([
      { name: "Rooms (PMS)", value: pmsRevenueTotal ?? pmsTotal },
      ...outletRowsPos.map((r) => ({ name: r._id, value: r.revenue })),
    ]),
    topCategories: topCategories.map((r) => ({
      name: r._id,
      quantity: r.quantity,
      revenue: r.revenue,
      value: posTotal ? (r.revenue / posTotal) * 100 : 0,
    })),
    topRoomTypes: topRoomTypes.map((r) => ({
      name: r._id,
      nights: r.nights,
      revenue: r.revenue,
      value: pmsTotal ? (r.revenue / pmsTotal) * 100 : 0,
    })),
    summary: {
      totalRevenue: total,
      pmsRevenue: pmsTotal,
      posRevenue: posTotal,
      otherRevenue: otherTotal,
      totalTransactions: totalTxn,
    },
  };
}

// ---------------- 2. PMS + POS Revenue ----------------
export function computePmsPosRevenue({ days, selectedStart }, raw) {
  const {
    pmsDailyRows,
    posDailyRows,
    previousPmsTotal,
    previousPosTotal,
    weekdayRowsPms,
    weekdayRowsPos,
    guestTypeRows,
  } = raw;
  const byDay = mapByDay(days, selectedStart, () => ({
    pms: 0,
    pos: 0,
    total: 0,
  }));
  for (const r of pmsDailyRows) {
    const b = byDay.get(dayKey(r._id));
    if (b) {
      b.pms = r.amount;
      b.total += r.amount;
    }
  }
  for (const r of posDailyRows) {
    const b = byDay.get(dayKey(r._id));
    if (b) {
      b.pos = r.amount;
      b.total += r.amount;
    }
  }
  const series = [...byDay.values()];

  const pmsTotal = pmsDailyRows.reduce((s, r) => s + r.amount, 0);
  const posTotal = posDailyRows.reduce((s, r) => s + r.amount, 0);
  const total = pmsTotal + posTotal;
  const prevTotal = (previousPmsTotal ?? 0) + (previousPosTotal ?? 0);
  const pmsContribNow = total ? (pmsTotal / total) * 100 : 0;
  const posContribNow = total ? (posTotal / total) * 100 : 0;
  const prevPmsContrib = prevTotal
    ? ((previousPmsTotal ?? 0) / prevTotal) * 100
    : null;
  const prevPosContrib = prevTotal
    ? ((previousPosTotal ?? 0) / prevTotal) * 100
    : null;

  const metrics = [
    {
      label: "Total PMS + POS Revenue",
      icon: "Layers",
      value: money(total),
      change: dash(total, prevTotal),
    },
    {
      label: "PMS Revenue (Rooms)",
      icon: "BedDouble",
      value: money(pmsTotal),
      change: dash(pmsTotal, previousPmsTotal),
    },
    {
      label: "POS Revenue (F&B)",
      icon: "ConciergeBell",
      value: money(posTotal),
      change: dash(posTotal, previousPosTotal),
    },
    {
      label: "PMS Contribution",
      icon: "Percent",
      value: `${pmsContribNow.toFixed(1)}%`,
      change:
        prevPmsContrib == null
          ? "—"
          : `${pmsContribNow - prevPmsContrib >= 0 ? "+" : ""}${(pmsContribNow - prevPmsContrib).toFixed(1)} pts`,
    },
    {
      label: "POS Contribution",
      icon: "Percent",
      value: `${posContribNow.toFixed(1)}%`,
      change:
        prevPosContrib == null
          ? "—"
          : `${posContribNow - prevPosContrib >= 0 ? "+" : ""}${(posContribNow - prevPosContrib).toFixed(1)} pts`,
    },
  ];

  const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const byDayType = WD.map((name, i) => ({
    name,
    pms: weekdayRowsPms.find((r) => r._id === i)?.amount || 0,
    pos: weekdayRowsPos.find((r) => r._id === i)?.amount || 0,
  }));

  return {
    metrics,
    series,
    revenueShare: withColor([
      { name: "PMS (Rooms)", value: pmsTotal },
      { name: "POS (F&B)", value: posTotal },
    ]),
    byDayType,
    guestType: withColor(guestTypeRows),
    dailyTable: series.map((r) => ({
      date: r.day,
      pms: r.pms,
      pos: r.pos,
      total: r.pms + r.pos,
      pmsPct: r.pms + r.pos ? (r.pms / (r.pms + r.pos)) * 100 : 0,
      posPct: r.pms + r.pos ? (r.pos / (r.pms + r.pos)) * 100 : 0,
    })),
    comparison: [
      {
        name: "Total Revenue",
        value: money(total),
        change: dash(total, prevTotal),
      },
      {
        name: "PMS Revenue",
        value: money(pmsTotal),
        change: dash(pmsTotal, previousPmsTotal),
      },
      {
        name: "POS Revenue",
        value: money(posTotal),
        change: dash(posTotal, previousPosTotal),
      },
      {
        name: "PMS %",
        value: `${pmsContribNow.toFixed(1)}%`,
        change:
          prevPmsContrib == null
            ? "—"
            : `${(pmsContribNow - prevPmsContrib).toFixed(1)} pts`,
      },
      {
        name: "POS %",
        value: `${posContribNow.toFixed(1)}%`,
        change:
          prevPosContrib == null
            ? "—"
            : `${(posContribNow - prevPosContrib).toFixed(1)} pts`,
      },
    ],
    summary: {
      totalRevenue: total,
      pmsRevenue: pmsTotal,
      posRevenue: posTotal,
      pmsContribution: pmsContribNow,
      posContribution: posContribNow,
    },
  };
}

// ---------------- 3. Property Profitability ----------------
export function computeProfitability({ days, selectedStart }, raw) {
  const {
    pmsDailyRows,
    posDailyRows,
    roomCostTotal,
    posCogsTotal,
    overheadTotal,
    previousTotals,
    outletRowsPos,
    pmsRevenueTotal,
    topProfitableItems,
    topProfitableRoomTypes,
  } = raw;
  const byDay = mapByDay(days, selectedStart, () => ({ revenue: 0, cost: 0 }));
  const dailyRoomCostPerRevenue =
    (pmsDailyRows.reduce((s, r) => s + r.amount, 0) || 1) > 0
      ? roomCostTotal / (pmsDailyRows.reduce((s, r) => s + r.amount, 0) || 1)
      : 0;
  for (const r of pmsDailyRows) {
    const b = byDay.get(dayKey(r._id));
    if (b) {
      b.revenue += r.amount;
      b.cost += r.amount * dailyRoomCostPerRevenue;
    }
  }
  const dailyCogsPerRevenue =
    (posDailyRows.reduce((s, r) => s + r.amount, 0) || 1) > 0
      ? posCogsTotal / (posDailyRows.reduce((s, r) => s + r.amount, 0) || 1)
      : 0;
  for (const r of posDailyRows) {
    const b = byDay.get(dayKey(r._id));
    if (b) {
      b.revenue += r.amount;
      b.cost += r.amount * dailyCogsPerRevenue;
    }
  }
  const overheadPerDay = overheadTotal / Math.max(days, 1);
  const series = [...byDay.values()].map((r) => ({
    ...r,
    cost: r.cost + overheadPerDay,
    profit: r.revenue - (r.cost + overheadPerDay),
    margin: r.revenue
      ? ((r.revenue - (r.cost + overheadPerDay)) / r.revenue) * 100
      : 0,
  }));

  const revenue = series.reduce((s, r) => s + r.revenue, 0);
  const totalCost = roomCostTotal + posCogsTotal + overheadTotal;
  const grossProfit =
    pmsRevenueTotal -
    roomCostTotal +
    (posDailyRows.reduce((s, r) => s + r.amount, 0) - posCogsTotal);
  const netProfit = grossProfit - overheadTotal;
  const margin = revenue ? (netProfit / revenue) * 100 : 0;
  const prevNet = previousTotals
    ? previousTotals.revenue - previousTotals.cost
    : null;

  const metrics = [
    {
      label: "Total Revenue",
      icon: "Layers",
      value: money(revenue),
      change: dash(revenue, previousTotals?.revenue),
    },
    {
      label: "Total Cost",
      icon: "Receipt",
      value: money(totalCost),
      change: dash(totalCost, previousTotals?.cost),
    },
    {
      label: "Gross Profit",
      icon: "TrendingUp",
      value: money(grossProfit),
      change: "—",
    },
    {
      label: "Profit Margin",
      icon: "Percent",
      value: `${margin.toFixed(1)}%`,
      change: "—",
    },
    {
      label: "Net Profit",
      icon: "LineChart",
      value: money(netProfit),
      change: dash(netProfit, prevNet),
    },
  ];

  const bySource = [
    {
      name: "Rooms (PMS)",
      revenue: pmsRevenueTotal,
      cost: roomCostTotal,
      profit: pmsRevenueTotal - roomCostTotal,
    },
    {
      name: "Restaurant (F&B)",
      revenue: posDailyRows.reduce((s, r) => s + r.amount, 0),
      cost: posCogsTotal,
      profit: posDailyRows.reduce((s, r) => s + r.amount, 0) - posCogsTotal,
    },
  ].map((r) => ({
    ...r,
    margin: r.revenue ? (r.profit / r.revenue) * 100 : 0,
  }));

  const byOutlet = [
    { name: "Rooms (PMS)", revenue: pmsRevenueTotal, cost: roomCostTotal },
    ...outletRowsPos.map((r) => ({
      name: r._id,
      revenue: r.revenue,
      cost:
        r.revenue * dailyCogsPerRevenue +
        overheadTotal / (outletRowsPos.length + 1),
    })),
  ].map((r) => ({
    ...r,
    profit: r.revenue - r.cost,
    margin: r.revenue ? ((r.revenue - r.cost) / r.revenue) * 100 : 0,
  }));

  return {
    metrics,
    series,
    bySource: withColor(bySource),
    byOutlet: withColor(byOutlet),
    revenueVsProfit: {
      revenue: withColor(
        byOutlet.map((o) => ({ name: o.name, value: o.revenue })),
      ),
      profit: withColor(
        byOutlet.map((o) => ({ name: o.name, value: Math.max(o.profit, 0) })),
      ),
    },
    topItems: topProfitableItems.map((r) => ({
      name: r._id,
      revenue: r.revenue,
      cost: r.cost,
      profit: r.revenue - r.cost,
      margin: r.revenue ? ((r.revenue - r.cost) / r.revenue) * 100 : 0,
    })),
    topRoomTypes: topProfitableRoomTypes.map((r) => {
      const cost =
        r.nights *
        (roomCostTotal /
          Math.max(
            pmsDailyRows.reduce((s, x) => s + x.amount, 0),
            1,
          )) *
        (r.revenue / Math.max(r.nights, 1));
      return {
        name: r._id,
        revenue: r.revenue,
        cost,
        profit: r.revenue - cost,
        margin: r.revenue ? ((r.revenue - cost) / r.revenue) * 100 : 0,
      };
    }),
    summary: {
      totalRevenue: revenue,
      totalCost,
      grossProfit,
      netProfit,
      margin,
    },
  };
}

// ---------------- 4. Guest -> Restaurant Conversion ----------------
export function computeConversion({ days, selectedStart }, raw) {
  const {
    dailyRows,
    totalInHouse,
    totalDined,
    repeatDiners,
    previousInHouse,
    previousDined,
    diningRevenue,
    byPurpose,
    byRoomType,
    topOutlets,
    topItems,
  } = raw;
  const byDay = mapByDay(days, selectedStart, () => ({ inHouse: 0, dined: 0 }));
  for (const r of dailyRows) {
    const b = byDay.get(dayKey(r._id));
    if (b) {
      b.inHouse = r.inHouse;
      b.dined = r.dined;
    }
  }
  const series = [...byDay.values()].map((r) => ({
    ...r,
    conversionRate: r.inHouse ? (r.dined / r.inHouse) * 100 : 0,
  }));

  const conversionRate = totalInHouse ? (totalDined / totalInHouse) * 100 : 0;
  const prevRate = previousInHouse
    ? (previousDined / previousInHouse) * 100
    : null;
  const avgSpend = totalDined ? diningRevenue / totalDined : 0;

  const metrics = [
    {
      label: "Total In-House Guests",
      icon: "Users",
      value: totalInHouse.toLocaleString("en-IN"),
      change: dash(totalInHouse, previousInHouse),
    },
    {
      label: "Guests Who Dined",
      icon: "ConciergeBell",
      value: totalDined.toLocaleString("en-IN"),
      change: dash(totalDined, previousDined),
    },
    {
      label: "Guest → Restaurant Conversion Rate",
      icon: "Percent",
      value: `${conversionRate.toFixed(1)}%`,
      change:
        prevRate == null
          ? "—"
          : `${conversionRate - prevRate >= 0 ? "+" : ""}${(conversionRate - prevRate).toFixed(1)} pts`,
    },
    {
      label: "Avg Spend per Dining Guest",
      icon: "IndianRupee",
      value: money(avgSpend),
      change: "—",
    },
    {
      label: "Total Restaurant Revenue (from In-House Guests)",
      icon: "Gift",
      value: money(diningRevenue),
      change: "—",
    },
  ];

  return {
    metrics,
    series,
    funnel: [
      { name: "Total In-House Guests", count: totalInHouse },
      { name: "Dined at Restaurant", count: totalDined },
      { name: "Repeat Diners (2+ visits)", count: repeatDiners },
    ],
    byPurpose: byPurpose.map((r) => ({
      name: r.purpose,
      inHouse: r.inHouse,
      dined: r.dined,
      conversionRate: r.inHouse ? (r.dined / r.inHouse) * 100 : 0,
    })),
    byRoomType: byRoomType.map((r) => ({
      name: r.roomType,
      inHouse: r.inHouse,
      dined: r.dined,
      conversionRate: r.inHouse ? (r.dined / r.inHouse) * 100 : 0,
      avgSpend: r.dined ? r.revenue / r.dined : 0,
      revenue: r.revenue,
    })),
    topOutlets: topOutlets.map((r) => ({
      name: r.outlet,
      dined: r.dined,
      conversionRate: totalInHouse ? (r.dined / totalInHouse) * 100 : 0,
      avgSpend: r.dined ? r.revenue / r.dined : 0,
      revenue: r.revenue,
    })),
    topItems,
    summary: {
      totalInHouse,
      totalDined,
      conversionRate,
      avgSpend,
      diningRevenue,
    },
  };
}

// ---------------- 5. Hotel Guest Spending ----------------
export function computeGuestSpending({ days, selectedStart }, raw) {
  const {
    dailyRows,
    totalGuests,
    totalSpend,
    posSpendTotal,
    roomSpendTotal,
    previousAvg,
    categoryBreakdown,
    byStayType,
    byGuestType,
    topGuests,
    topRooms,
  } = raw;
  const byDay = mapByDay(days, selectedStart, () => ({
    totalSpend: 0,
    count: 0,
  }));
  for (const r of dailyRows) {
    const b = byDay.get(dayKey(r._id));
    if (b) {
      b.totalSpend = r.totalSpend;
      b.count = r.count;
    }
  }
  const series = [...byDay.values()].map((r) => ({
    ...r,
    avgSpend: r.count ? r.totalSpend / r.count : 0,
  }));

  const avgSpend = totalGuests ? totalSpend / totalGuests : 0;
  const metrics = [
    {
      label: "Total Hotel Guests",
      icon: "Users",
      value: totalGuests.toLocaleString("en-IN"),
      change: "—",
    },
    {
      label: "Avg Guest Spend (per guest)",
      icon: "IndianRupee",
      value: money(avgSpend),
      change: dash(avgSpend, previousAvg),
    },
    {
      label: "Total Guest Spending",
      icon: "Boxes",
      value: money(totalSpend),
      change: "—",
    },
    {
      label: "POS Spend per Guest (F&B + Other)",
      icon: "ConciergeBell",
      value: money(totalGuests ? posSpendTotal / totalGuests : 0),
      change: "—",
    },
    {
      label: "Room Revenue per Guest",
      icon: "BedDouble",
      value: money(totalGuests ? roomSpendTotal / totalGuests : 0),
      change: "—",
    },
  ];

  return {
    metrics,
    series,
    categoryBreakdown: withColor(categoryBreakdown),
    byStayType,
    byGuestType,
    topGuests: topGuests.map((g) => ({
      name: g.name,
      roomSpend: g.roomSpend,
      posSpend: g.posSpend,
      totalSpend: g.roomSpend + g.posSpend,
      nights: g.nights,
      avgSpendPerNight: g.nights ? (g.roomSpend + g.posSpend) / g.nights : 0,
    })),
    topRooms: topRooms.map((r) => ({
      name: r.roomType,
      guests: r.guests,
      posSpend: r.posSpend,
      avgSpendPerGuest: r.guests ? r.posSpend / r.guests : 0,
    })),
    summary: {
      totalGuests,
      totalSpend,
      avgSpend,
      posSpendTotal,
      roomSpendTotal,
    },
  };
}

// ---------------- 6. Revenue Forecast (combined) ----------------
export function computeRevenueForecast({ days, end }, raw) {
  const { pmsHistory, posHistory, occupancyHistory, coversHistory } = raw;
  const pmsF = forecastSeries(pmsHistory, days, { min: 0 });
  const posF = forecastSeries(posHistory, days, { min: 0 });
  const occF = forecastSeries(occupancyHistory, days, { min: 0, max: 100 });
  const coversF = forecastSeries(coversHistory, days, { min: 0 });

  const totalLower = pmsF.lower.map((v, i) => v + posF.lower[i]);
  const totalUpper = pmsF.upper.map((v, i) => v + posF.upper[i]);
  const totalPred = pmsF.predicted.map((v, i) => v + posF.predicted[i]);

  const sum = (arr) => arr.reduce((s, v) => s + v, 0);
  const metrics = [
    {
      label: "Forecasted Total Revenue",
      icon: "TrendingUp",
      value: money(sum(totalPred)),
      change: "forecast",
    },
    {
      label: "Forecasted Room Revenue (PMS)",
      icon: "BedDouble",
      value: money(sum(pmsF.predicted)),
      change: "forecast",
    },
    {
      label: "Forecasted F&B Revenue (POS)",
      icon: "ConciergeBell",
      value: money(sum(posF.predicted)),
      change: "forecast",
    },
    {
      label: "Expected Occupancy",
      icon: "Users",
      value: `${(occF.predicted.reduce((s, v) => s + v, 0) / Math.max(occF.predicted.length, 1)).toFixed(0)}%`,
      change: "forecast",
    },
    {
      label: "Expected Covers (Restaurant)",
      icon: "Utensils",
      value: Math.round(sum(coversF.predicted)).toLocaleString("en-IN"),
      change: "forecast",
    },
  ];

  const series = Array.from({ length: days }, (_, i) => {
    const date = new Date(end.getTime() + i * dayMs);
    return {
      day: dateLabel(date),
      total: totalPred[i],
      totalLower: totalLower[i],
      totalUpper: totalUpper[i],
      pms: pmsF.predicted[i],
      pos: posF.predicted[i],
      occupancy: occF.predicted[i],
      covers: coversF.predicted[i],
      avgSpendPerCover: coversF.predicted[i]
        ? posF.predicted[i] / coversF.predicted[i]
        : 0,
    };
  });
  const next7 = series.slice(0, 7);

  // Monthly outlook: fold the daily forecast into ~30-day buckets (up to 6) for the "6 month" view.
  const monthly = [];
  for (let m = 0; m < Math.min(6, Math.ceil(days / 30)); m++) {
    const chunk = series.slice(m * 30, m * 30 + 30);
    if (!chunk.length) break;
    monthly.push({
      period: chunk[0].day,
      pms: sum(chunk.map((c) => c.pms)),
      pos: sum(chunk.map((c) => c.pos)),
      total: sum(chunk.map((c) => c.total)),
    });
  }
  const bySource = monthly.map((m, i) => ({
    period: m.period,
    pms: m.pms,
    pos: m.pos,
    total: m.total,
    growth: i === 0 ? "—" : pctChange(m.total, monthly[i - 1].total),
  }));

  return {
    metrics,
    series,
    next7,
    monthly,
    bySource,
    summary: {
      forecastedTotal: sum(totalPred),
      forecastedPms: sum(pmsF.predicted),
      forecastedPos: sum(posF.predicted),
      expectedOccupancy:
        occF.predicted.reduce((s, v) => s + v, 0) /
        Math.max(occF.predicted.length, 1),
      expectedCovers: sum(coversF.predicted),
    },
  };
}

// ---------------- 7. Customer Lifetime Value ----------------
export function computeClv(_windows, raw) {
  const { guests, monthlyRows } = raw;
  const totalGuests = guests.length;
  const totalCLV = guests.reduce((s, g) => s + g.totalValue, 0);
  const avgCLV = totalGuests ? totalCLV / totalGuests : 0;
  const repeatGuests = guests.filter((g) => g.totalStays >= 2);
  const repeatRate = totalGuests
    ? (repeatGuests.length / totalGuests) * 100
    : 0;
  const revenueFromRepeat = repeatGuests.reduce((s, g) => s + g.totalValue, 0);
  const avgRelationship = totalGuests
    ? guests.reduce((s, g) => s + g.totalStays, 0) / totalGuests
    : 0;

  const metrics = [
    {
      label: "Total Guests (Unique)",
      icon: "Users",
      value: totalGuests.toLocaleString("en-IN"),
      change: "—",
    },
    {
      label: "Average Customer Lifetime Value",
      icon: "IndianRupee",
      value: money(avgCLV),
      change: "—",
    },
    {
      label: "Repeat Guest Rate",
      icon: "Repeat",
      value: `${repeatRate.toFixed(1)}%`,
      change: "—",
    },
    {
      label: "Revenue from Repeat Guests",
      icon: "Boxes",
      value: money(revenueFromRepeat),
      change: "—",
    },
    {
      label: "Avg Length of Relationship",
      icon: "CalendarDays",
      value: `${avgRelationship.toFixed(1)} Stays`,
      change: "—",
    },
  ];

  const bounds = [
    [75000, "High Value (₹75,000+)"],
    [25000, "Mid Value (₹25,000 - ₹75,000)"],
    [5000, "Low Value (₹5,000 - ₹25,000)"],
    [0, "New Guests (< ₹5,000)"],
  ];
  const bucketOf = (v) => bounds.find(([b]) => v >= b)?.[1] || bounds.at(-1)[1];
  const segMap = new Map();
  for (const g of guests) {
    const k = bucketOf(g.totalValue);
    const cur = segMap.get(k) || { name: k, count: 0, revenue: 0 };
    cur.count++;
    cur.revenue += g.totalValue;
    segMap.set(k, cur);
  }
  const segmentation = withColor(
    bounds.map(
      ([, name]) => segMap.get(name) || { name, count: 0, revenue: 0 },
    ),
  );

  const byPurpose = [
    "Leisure",
    "Business",
    "Family",
    "Event/Conference",
    "Other",
  ]
    .map((purpose) => {
      const g = guests.filter((x) => x.purpose === purpose);
      return {
        name: purpose,
        avgClv: g.length
          ? g.reduce((s, x) => s + x.totalValue, 0) / g.length
          : 0,
      };
    })
    .filter((r) => r.avgClv > 0);

  const top10 = [...guests]
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 10)
    .map((g) => ({
      name: g.name,
      stays: g.totalStays,
      totalSpend: g.totalValue,
      clv: g.totalStays ? g.totalValue / g.totalStays : g.totalValue,
    }));

  const firstStaySpend =
    guests
      .filter((g) => g.totalStays === 1)
      .reduce((s, g) => s + g.totalValue, 0) /
    Math.max(guests.filter((g) => g.totalStays === 1).length, 1);
  const repeatStaySpend =
    repeatGuests.reduce((s, g) => s + g.totalValue / g.totalStays, 0) /
    Math.max(repeatGuests.length, 1);

  const distBounds = [
    [100000, Infinity, "₹1,00,000+"],
    [75000, 100000, "₹75,000 - ₹1,00,000"],
    [50000, 75000, "₹50,000 - ₹75,000"],
    [25000, 50000, "₹25,000 - ₹50,000"],
    [5000, 25000, "₹5,000 - ₹25,000"],
    [0, 5000, "< ₹5,000"],
  ];
  const distribution = distBounds
    .map(([lo, hi, label]) => ({
      range: label,
      guests: guests.filter((g) => g.totalValue >= lo && g.totalValue < hi)
        .length,
    }))
    .map((r) => ({
      ...r,
      pct: totalGuests ? (r.guests / totalGuests) * 100 : 0,
    }));

  return {
    metrics,
    trend: monthlyRows.map((r) => ({
      day: r.label,
      clv: r.avgClv,
      totalRevenue: r.totalRevenue,
    })),
    segmentation,
    byPurpose: withColor(byPurpose),
    top10,
    revenueContribution: withColor([
      { name: "Repeat Guests", value: revenueFromRepeat },
      { name: "One-time Guests", value: totalCLV - revenueFromRepeat },
    ]),
    repeatBehavior: { firstStaySpend, repeatStaySpend },
    distribution,
    summary: {
      totalGuests,
      avgCLV,
      repeatRate,
      revenueFromRepeat,
      avgRelationship,
    },
  };
}

// ---------------- 8. AI Recommendations ----------------
export function computeRecommendations(_windows, raw) {
  const { recommendations } = raw;
  const active = recommendations.filter((r) => r.status !== "dismissed");
  const applied = recommendations.filter((r) => r.status === "applied");
  const potentialUplift = active
    .filter((r) => r.status === "new")
    .reduce((s, r) => s + r.estMonthlyImpact, 0);
  const top = [...active].sort(
    (a, b) => b.estMonthlyImpact - a.estMonthlyImpact,
  )[0];

  const metrics = [
    {
      label: "Potential Revenue Uplift",
      icon: "TrendingUp",
      value: money(potentialUplift),
      change: `from ${active.filter((r) => r.status === "new").length} opportunities`,
    },
    {
      label: "Top Opportunity",
      icon: "Target",
      value: top ? top.title : "—",
      change: top ? `${money(top.estMonthlyImpact)} est. impact` : "—",
    },
    {
      label: "Guest Experience Score",
      icon: "Star",
      value: `${(raw.guestExperienceScore || 0).toFixed(1)} / 10`,
      change: "—",
    },
    {
      label: "Operational Efficiency",
      icon: "Zap",
      value: `${raw.operationalEfficiency >= 0 ? "+" : ""}${(raw.operationalEfficiency || 0).toFixed(1)}%`,
      change: "vs previous period",
    },
    {
      label: "AI Suggestions",
      icon: "Sparkles",
      value: active.length.toLocaleString("en-IN"),
      change: `${active.filter((r) => r.priority === "High").length} high priority`,
    },
  ];

  const byCategory = withColor(
    ["Revenue", "Operations", "Guest Experience", "Marketing"]
      .map((name) => ({
        name,
        value: active.filter((r) => r.category === name).length,
      }))
      .filter((r) => r.value > 0),
  );
  const upliftByCategory = [
    "Revenue",
    "Operations",
    "Guest Experience",
    "Marketing",
  ].map((cat) => ({
    name: cat,
    current: 0,
    potential: active
      .filter((r) => r.category === cat)
      .reduce((s, r) => s + r.estMonthlyImpact, 0),
  }));

  return {
    metrics,
    recommendations: active,
    applied,
    quickWins: active.filter((r) => r.effort === "Low" && r.status === "new"),
    longTerm: active.filter((r) => r.effort !== "Low" && r.status === "new"),
    byCategory,
    upliftByCategory,
    summary: {
      potentialUplift,
      suggestionCount: active.length,
      highPriority: active.filter((r) => r.priority === "High").length,
    },
  };
}

const DISPATCH = {
  "total-revenue": computeTotalRevenue,
  "pms-pos-revenue": computePmsPosRevenue,
  profitability: computeProfitability,
  conversion: computeConversion,
  "guest-spending": computeGuestSpending,
  "revenue-forecast": computeRevenueForecast,
  clv: computeClv,
  recommendations: computeRecommendations,
};

export function computeBiPayload(id, range, windows, raw, source = "live") {
  const body = DISPATCH[id](windows, raw);
  const meta = BI_DASHBOARDS[id];
  return {
    id,
    module: "Business Intelligence",
    title: meta.title,
    subtitle: meta.subtitle,
    range,
    generatedAt: new Date().toISOString(),
    source,
    ...body,
  };
}
