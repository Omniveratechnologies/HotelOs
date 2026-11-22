"use client";
import TrendChart from "../TrendChart";
import DonutBreakdown from "../DonutBreakdown";
import BarList from "../BarList";
import { money } from "../format";

export default function RevenueDashboard({ data }) {
  return (
    <>
      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Revenue Trend</div>
          <div className="card-subtitle">
            Daily revenue for the selected period
          </div>
          <TrendChart
            data={data.series}
            lines={[
              { key: "total", name: "Total Revenue", color: "#157a70" },
              { key: "room", name: "Room Revenue", color: "#6b7cae" },
              { key: "services", name: "Services Revenue", color: "#d47748" },
            ]}
          />
        </div>
        <div className="card">
          <div className="card-title">Revenue Breakdown</div>
          <div className="card-subtitle">Share of revenue by category</div>
          <DonutBreakdown
            data={data.revenueBreakdown}
            centerLabel="Total Revenue"
            centerValue={money(data.summary.totalRevenue)}
          />
        </div>
      </div>

      <div className="three-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Revenue by Room Type</div>
          <div className="card-subtitle">Top performing room types</div>
          <BarList
            rows={data.roomTypes.map((r) => ({
              name: r.name,
              value: r.revenue,
              color: r.color,
            }))}
          />
        </div>
        <div className="card">
          <div className="card-title">Revenue by Booking Source</div>
          <div className="card-subtitle">Where your revenue is coming from</div>
          <BarList
            rows={data.sources.map((s) => ({
              name: s.name,
              value: s.revenue,
              color: s.color,
            }))}
          />
        </div>
        <div className="card">
          <div className="card-title">Revenue by Payment Method</div>
          <div className="card-subtitle">How guests are paying</div>
          <BarList
            rows={data.paymentMethods.map((p) => ({
              name: p.name,
              value: p.revenue,
              color: p.color,
            }))}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-title">Revenue Forecast</div>
        <div className="card-subtitle">AI-powered revenue prediction</div>
        <div style={{ display: "flex", gap: 32 }}>
          <div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
              Next 7 Days
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {data.forecastSummary.revenue7
                ? `${money(data.forecastSummary.revenue7.lower)} – ${money(data.forecastSummary.revenue7.upper)}`
                : "—"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
              Next 30 Days
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {data.forecastSummary.revenue30
                ? `${money(data.forecastSummary.revenue30.lower)} – ${money(data.forecastSummary.revenue30.upper)}`
                : "—"}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
