import { TrendChart } from "../../shared/components/TrendChart";
import {
  DonutBreakdown,
  type DonutItem,
} from "../../shared/components/DonutBreakdown";
import { BarList } from "../../shared/components/BarList";
import { money } from "../../shared/utils/formatters";
import type { DashboardData } from "../../shared/types";

interface NamedRevenueItem {
  name: string;
  revenue: number;
  color?: string;
}

export function RevenueDashboard({ data }: { data: DashboardData }) {
  const series = (data.series as Record<string, unknown>[]) || [];
  const revenueBreakdown = (data.revenueBreakdown as DonutItem[]) || [];
  const roomTypes = (data.roomTypes as NamedRevenueItem[]) || [];
  const sources = (data.sources as NamedRevenueItem[]) || [];
  const paymentMethods = (data.paymentMethods as NamedRevenueItem[]) || [];
  const summary = (data.summary as { totalRevenue?: number }) || {};
  const forecastSummary =
    (data.forecastSummary as {
      revenue7?: { lower: number; upper: number };
      revenue30?: { lower: number; upper: number };
    }) || {};

  return (
    <>
      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Revenue Trend</div>
          <div className="card-subtitle">
            Daily revenue for the selected period
          </div>
          <TrendChart
            data={series}
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
            data={revenueBreakdown}
            centerLabel="Total Revenue"
            centerValue={money(summary.totalRevenue)}
          />
        </div>
      </div>

      <div className="three-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Revenue by Room Type</div>
          <div className="card-subtitle">Top performing room types</div>
          <BarList
            rows={roomTypes.map((r) => ({
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
            rows={sources.map((s) => ({
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
            rows={paymentMethods.map((p) => ({
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
              {forecastSummary.revenue7
                ? `${money(forecastSummary.revenue7.lower)} – ${money(forecastSummary.revenue7.upper)}`
                : "—"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
              Next 30 Days
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {forecastSummary.revenue30
                ? `${money(forecastSummary.revenue30.lower)} – ${money(forecastSummary.revenue30.upper)}`
                : "—"}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default RevenueDashboard;
