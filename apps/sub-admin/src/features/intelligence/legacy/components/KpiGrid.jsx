"use client";
import { Icon } from "./icons";

const palette = [
  "#157a70",
  "#d47748",
  "#6b7cae",
  "#b98b38",
  "#478a66",
  "#9b6a8d",
];

function ChangeBadge({ change }) {
  if (!change || change === "—" || change === "forecast") {
    return (
      <span className="kpi-change flat">
        <Icon name="Minus" size={12} />{" "}
        {change === "forecast" ? "AI forecast" : "No change data"}
      </span>
    );
  }
  const n = parseFloat(change);
  const up = Number.isFinite(n) && n > 0;
  const down = Number.isFinite(n) && n < 0;
  return (
    <span className={`kpi-change ${up ? "up" : down ? "down" : "flat"}`}>
      <Icon
        name={up ? "ArrowUpRight" : down ? "ArrowDownRight" : "Minus"}
        size={12}
      />
      {change}{" "}
      <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
        vs previous
      </span>
    </span>
  );
}

export default function KpiGrid({ metrics }) {
  if (!metrics?.length) return null;
  return (
    <div className="kpi-grid grid">
      {metrics.map((m, i) => (
        <div className="card kpi-card" key={m.label}>
          <div className="kpi-top">
            <span className="kpi-label">{m.label}</span>
            <span
              className="kpi-icon"
              style={{
                background: `${palette[i % palette.length]}1a`,
                color: palette[i % palette.length],
              }}
            >
              <Icon name={m.icon} size={16} />
            </span>
          </div>
          <span className="kpi-value">{m.value}</span>
          <ChangeBadge change={m.change} />
        </div>
      ))}
    </div>
  );
}
