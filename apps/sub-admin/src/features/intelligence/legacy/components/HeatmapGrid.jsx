"use client";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Fixed color bands so the legend always means the same thing regardless of the data's own range.
function colorFor(value, bands) {
  for (const band of bands) if (value <= band.max) return band.color;
  return bands[bands.length - 1].color;
}

const PCT_BANDS = [
  { max: 20, color: "#d0483f", label: "0–20%" },
  { max: 40, color: "#e08a4f", label: "21–40%" },
  { max: 60, color: "#d9b23c", label: "41–60%" },
  { max: 80, color: "#7fae5a", label: "61–80%" },
  { max: 100, color: "#1f9d55", label: "81–100%" },
];
const RATE_BANDS = [
  { max: 2000, color: "#1f9d55", label: "<₹2K" },
  { max: 3000, color: "#7fae5a", label: "₹2K–3K" },
  { max: 4000, color: "#d9b23c", label: "₹3K–4K" },
  { max: 5000, color: "#e08a4f", label: "₹4K–5K" },
  { max: Infinity, color: "#d0483f", label: "₹5K+" },
];

export default function HeatmapGrid({ rows, mode = "pct" }) {
  const bands = mode === "pct" ? PCT_BANDS : RATE_BANDS;
  return (
    <div>
      <div className="heatmap-grid" style={{ marginBottom: 4 }}>
        <div />
        {DAYS.map((d) => (
          <div
            key={d}
            className="heatmap-label"
            style={{ justifyContent: "center" }}
          >
            {d}
          </div>
        ))}
      </div>
      {rows.map((row) => (
        <div
          className="heatmap-grid"
          key={row.name}
          style={{ marginBottom: 4 }}
        >
          <div className="heatmap-label">{row.name.replace(" Room", "")}</div>
          {row.values.map((v, i) => (
            <div
              key={i}
              className="heatmap-cell"
              style={{ background: colorFor(v, bands) }}
            >
              {mode === "pct"
                ? `${v}%`
                : v >= 1000
                  ? `${(v / 1000).toFixed(1)}K`
                  : v}
            </div>
          ))}
        </div>
      ))}
      <div className="heatmap-legend">
        {bands.map((b) => (
          <span key={b.label}>
            <span
              className="heatmap-legend-swatch"
              style={{ background: b.color }}
            />
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}
