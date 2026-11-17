import { ComboChart } from "../../shared/components/ComboChart";
import { BarList } from "../../shared/components/BarList";
import { HeatmapGrid } from "../../shared/components/HeatmapGrid";
import {
  ComparisonCard,
  type ComparisonRow,
} from "../../shared/components/ComparisonCard";
import type { DashboardData } from "../../shared/types";

interface NamedRevparItem {
  name: string;
  revpar: number;
  color?: string;
}

export function RevparDashboard({ data }: { data: DashboardData }) {
  const series = (data.series as Record<string, unknown>[]) || [];
  const roomTypes = (data.roomTypes as NamedRevparItem[]) || [];
  const sources = (data.sources as NamedRevparItem[]) || [];
  const weekdays = (data.weekdays as NamedRevparItem[]) || [];
  const revparHeatmap =
    (data.revparHeatmap as { name: string; values: number[] }[]) || [];
  const comparison = (data.comparison as ComparisonRow[]) || [];

  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">RevPAR Trend</div>
        <div className="card-subtitle">Daily RevPAR vs ADR and Occupancy</div>
        <ComboChart
          data={series}
          bar={{ key: "revpar", name: "RevPAR (₹)", color: "#157a70" }}
          lines={[
            { key: "adr", name: "ADR (₹)", color: "#d47748" },
            {
              key: "occupancyPct",
              name: "Occupancy (%)",
              color: "#6b7cae",
              yAxisId: "right",
            },
          ]}
        />
      </div>

      <div className="three-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">RevPAR by Room Type</div>
          <div className="card-subtitle">
            Revenue per available room by category
          </div>
          <BarList
            rows={roomTypes.map((r) => ({
              name: r.name,
              value: r.revpar,
              color: r.color,
            }))}
          />
        </div>
        <div className="card">
          <div className="card-title">RevPAR by Booking Source</div>
          <div className="card-subtitle">
            Average RevPAR across booking sources
          </div>
          <BarList
            rows={sources.map((s) => ({
              name: s.name,
              value: s.revpar,
              color: s.color,
            }))}
          />
        </div>
        <div className="card">
          <div className="card-title">RevPAR by Day of Week</div>
          <div className="card-subtitle">Average RevPAR for each day</div>
          <BarList
            rows={weekdays.map((w) => ({ name: w.name, value: w.revpar }))}
          />
        </div>
      </div>

      <div className="two-col grid">
        <div className="card">
          <div className="card-title">RevPAR Heatmap</div>
          <div className="card-subtitle">
            Occupancy pattern by day and room type (the main driver of RevPAR)
          </div>
          <HeatmapGrid rows={revparHeatmap} mode="pct" />
        </div>
        <div className="card">
          <div className="card-title">RevPAR Comparison</div>
          <div className="card-subtitle">
            Compare RevPAR with previous period
          </div>
          <ComparisonCard rows={comparison} />
        </div>
      </div>
    </>
  );
}

export default RevparDashboard;
