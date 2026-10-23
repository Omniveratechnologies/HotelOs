"use client";
import { useState } from "react";
import DonutBreakdown from "../DonutBreakdown";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { money } from "../format";

const CATS = ["All", "Revenue", "Operations", "Guest Experience", "Marketing"];
const PRIORITY_BADGE = { High: "high", Medium: "medium", Low: "low" };

function UpliftChart({ rows }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={rows} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v) => money(v)}
          contentStyle={{
            borderRadius: 10,
            border: "1px solid #e8e4d9",
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar
          dataKey="current"
          name="Current Revenue"
          fill="#c9c4b5"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="potential"
          name="Potential Revenue (with AI)"
          fill="#1E6FEB"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function RecRow({ rec, onAction, isDemo }) {
  const [busy, setBusy] = useState(false);
  const [localStatus, setLocalStatus] = useState(rec.status);

  async function act(action) {
    setBusy(true);
    if (!rec.id) {
      setLocalStatus(action === "apply" ? "applied" : "dismissed");
      setBusy(false);
      return;
    }
    const ok = await onAction(rec.id, action);
    if (ok) setLocalStatus(action === "apply" ? "applied" : "dismissed");
    setBusy(false);
  }

  return (
    <div
      className="bar-row"
      style={{
        alignItems: "flex-start",
        flexDirection: "column",
        gap: 8,
        paddingBottom: 14,
        marginBottom: 14,
        borderBottom: "1px dashed var(--border)",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 3,
            }}
          >
            <span
              className={`badge ${PRIORITY_BADGE[rec.priority] || "medium"}`}
            >
              {rec.priority}
            </span>
            <span style={{ fontWeight: 700, fontSize: 13.5 }}>{rec.title}</span>
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
            {rec.description}
          </div>
          <div
            style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}
          >
            Est. Impact:{" "}
            <strong style={{ color: "var(--text)" }}>
              {money(rec.estMonthlyImpact)} / month
            </strong>{" "}
            · Effort: {rec.effort} · {rec.category}
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          {localStatus === "applied" ? (
            <span className="badge low">
              Applied{!rec.id && isDemo ? " (not saved)" : ""}
            </span>
          ) : localStatus === "dismissed" ? (
            <span className="badge medium">Dismissed</span>
          ) : (
            <button
              className="icon-btn"
              style={{
                width: "auto",
                padding: "0 14px",
                background: "var(--accent)",
                color: "#fff",
                border: "none",
              }}
              onClick={() => act("apply")}
              disabled={busy}
            >
              {busy ? "…" : "Apply"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RecommendationsDashboard({ data, onAction }) {
  const [filter, setFilter] = useState("All");
  const isDemo = data.source === "demo";
  const filtered =
    filter === "All"
      ? data.recommendations
      : data.recommendations.filter((r) => r.category === filter);

  return (
    <>
      {isDemo && (
        <div
          className="card"
          style={{
            marginBottom: 16,
            background: "#fdf3e3",
            borderColor: "#f0dca8",
          }}
        >
          <div style={{ fontSize: 12.5 }}>
            Demo mode: Apply/Dismiss only updates this screen — it isn&apos;t
            saved. Connect MongoDB to persist recommendation status.
          </div>
        </div>
      )}
      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-head-row">
            <div>
              <div className="card-title">Top AI Recommendations</div>
              <div className="card-subtitle">
                Personalized recommendations based on your hotel&apos;s PMS +
                POS data
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 14,
              flexWrap: "wrap",
            }}
          >
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                style={{
                  border: "1px solid var(--border)",
                  background: filter === c ? "var(--sidebar-bg)" : "#fff",
                  color: filter === c ? "#fff" : "var(--text)",
                  borderRadius: 8,
                  padding: "5px 11px",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                {c}
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
              No recommendations in this category right now.
            </div>
          )}
          {filtered.map((r) => (
            <RecRow
              key={r.id || r.key}
              rec={r}
              onAction={onAction}
              isDemo={isDemo}
            />
          ))}
        </div>
        <div className="card">
          <div className="card-title">Opportunity Breakdown</div>
          <div className="card-subtitle">
            Number of AI recommendations by category
          </div>
          <DonutBreakdown
            data={data.byCategory}
            centerLabel="Suggestions"
            centerValue={data.summary.suggestionCount}
            valueIsMoney={false}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-title">Revenue Uplift Potential</div>
        <div className="card-subtitle">
          Estimated additional revenue from implementing AI recommendations
        </div>
        <UpliftChart rows={data.upliftByCategory} />
      </div>
    </>
  );
}
