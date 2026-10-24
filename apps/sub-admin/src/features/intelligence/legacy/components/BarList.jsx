"use client";

const money = (v) => `₹${Math.round(v || 0).toLocaleString("en-IN")}`;
const palette = [
  "#157a70",
  "#d47748",
  "#6b7cae",
  "#b98b38",
  "#478a66",
  "#9b6a8d",
];

/**
 * rows: [{ name, value, sub? }] — `value` drives bar width (relative to the max in the list).
 * formatValue(row) controls the trailing label text.
 */
export default function BarList({ rows, formatValue }) {
  const max = Math.max(...rows.map((r) => r.value || 0), 1);
  return (
    <div>
      {rows.map((r, i) => (
        <div className="bar-row" key={r.name}>
          <span className="name" title={r.name}>
            {r.name}
          </span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: `${Math.max(((r.value || 0) / max) * 100, 3)}%`,
                background: r.color || palette[i % palette.length],
              }}
            />
          </div>
          <span className="bar-value">
            {formatValue ? formatValue(r) : money(r.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
