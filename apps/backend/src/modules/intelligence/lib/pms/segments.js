// k-means guest segmentation on (spend, stays, avg nights, avg lead time), z-scored.
function zscore(rows) {
  const d = rows[0].length;
  const mean = Array(d).fill(0);
  const sd = Array(d).fill(0);
  rows.forEach((r) =>
    r.forEach((v, j) => {
      mean[j] += v / rows.length;
    }),
  );
  rows.forEach((r) =>
    r.forEach((v, j) => {
      sd[j] += (v - mean[j]) ** 2 / rows.length;
    }),
  );
  return {
    z: rows.map((r) =>
      r.map((v, j) => (v - mean[j]) / (Math.sqrt(sd[j]) || 1)),
    ),
    mean,
    sd: sd.map((s) => Math.sqrt(s) || 1),
  };
}

export function kmeans(points, k = 4, iterations = 50) {
  const n = points.length;
  if (n < k) return { labels: points.map((_, i) => i), centroids: points };
  // deterministic farthest-point init
  const centroids = [points[0]];
  while (centroids.length < k) {
    let best = -1;
    let bestD = -1;
    points.forEach((p, i) => {
      const dmin = Math.min(
        ...centroids.map((c) => c.reduce((s, v, j) => s + (v - p[j]) ** 2, 0)),
      );
      if (dmin > bestD) {
        bestD = dmin;
        best = i;
      }
    });
    centroids.push(points[best]);
  }
  let labels = Array(n).fill(0);
  for (let it = 0; it < iterations; it++) {
    let moved = false;
    labels = points.map((p, i) => {
      let bi = 0;
      let bd = Infinity;
      centroids.forEach((c, ci) => {
        const d = c.reduce((s, v, j) => s + (v - p[j]) ** 2, 0);
        if (d < bd) {
          bd = d;
          bi = ci;
        }
      });
      if (bi !== labels[i]) moved = true;
      return bi;
    });
    centroids.forEach((c, ci) => {
      const members = points.filter((_, i) => labels[i] === ci);
      if (members.length)
        centroids[ci] = c.map(
          (_, j) => members.reduce((s, m) => s + m[j], 0) / members.length,
        );
    });
    if (!moved && it > 0) break;
  }
  return { labels, centroids };
}

/** guests: [{ id, spend, stays, avgNights, avgLead }] -> [{ id, segment }] with readable names. */
export function segmentGuests(guests, k = 4) {
  if (guests.length < k * 5) return [];
  const raw = guests.map((g) => [g.spend, g.stays, g.avgNights, g.avgLead]);
  const { z } = zscore(raw);
  const { labels, centroids } = kmeans(z, k);
  const name = (c) => {
    const [spend, stays, nights, lead] = c;
    if (spend > 0.5 && stays > 0.3) return "High-value repeat guests";
    if (stays > 0.3) return "Loyal repeat guests";
    if (nights > 0.5) return "Long-stay guests";
    if (lead > 0.5) return "Early planners";
    if (spend < -0.3) return "Budget / occasional guests";
    return "Short-break guests";
  };
  const used = new Map();
  const names = centroids.map((c) => {
    const base = name(c);
    const n = (used.get(base) || 0) + 1;
    used.set(base, n);
    return n > 1 ? `${base} ${n}` : base;
  });
  return guests.map((g, i) => ({ id: g.id, segment: names[labels[i]] }));
}
