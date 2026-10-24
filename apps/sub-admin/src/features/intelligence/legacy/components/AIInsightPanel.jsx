"use client";
import { Icon } from "./icons";

const ROWS = [
  {
    key: "topInsight",
    label: "Top Insight",
    icon: "TrendingUp",
    bg: "#e3f1ee",
    fg: "var(--accent)",
  },
  {
    key: "opportunity",
    label: "Opportunity",
    icon: "Lightbulb",
    bg: "#fdf3e3",
    fg: "var(--warning)",
  },
  {
    key: "risk",
    label: "Risk",
    icon: "AlertTriangle",
    bg: "#fbe9e7",
    fg: "var(--danger)",
  },
  {
    key: "recommendation",
    label: "Recommendation",
    icon: "Target",
    bg: "#ecefF7",
    fg: "var(--accent3)",
  },
];

export default function AIInsightPanel({ insights }) {
  return (
    <div className="card insight-card">
      <div className="card-head-row">
        <div
          className="card-title"
          style={{ display: "flex", alignItems: "center", gap: 7 }}
        >
          <Icon name="Sparkles" size={16} style={{ color: "var(--accent)" }} />{" "}
          AI Insights
        </div>
        {insights?.model && (
          <span className="source-tag">
            {insights.model === "template-v1" ? "rule-based" : insights.model}
          </span>
        )}
      </div>
      {insights?.warning && (
        <div className="insight-warning" role="status">
          {insights.warning}
        </div>
      )}
      {insights?.provider === "groq" && (
        <div className="insight-attribution">
          Aggregate dashboard metrics are processed by Groq to generate these
          insights.
        </div>
      )}
      {!insights ? (
        <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
          Generating insights…
        </div>
      ) : (
        ROWS.map((row) => (
          <div className="insight-row" key={row.key}>
            <span
              className="insight-icon"
              style={{ background: row.bg, color: row.fg }}
            >
              <Icon name={row.icon} size={13} />
            </span>
            <div>
              <div className="insight-label">{row.label}</div>
              <div className="insight-text">{insights[row.key]}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
