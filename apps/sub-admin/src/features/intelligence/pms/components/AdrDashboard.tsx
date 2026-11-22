import { TrendChart } from "../../shared/components/TrendChart";
import { BarList } from "../../shared/components/BarList";
import { HeatmapGrid } from "../../shared/components/HeatmapGrid";
import { ComparisonCard } from "../../shared/components/ComparisonCard";
import type { DashboardData } from "../../shared/types";

interface NamedValueItem {
  name: string;
  adr: number;
  color?: string;
}

export function AdrDashboard({ data }: { data: DashboardData }) {
  const weekdays = (data.weekdays as NamedValueItem[]) || [];
  const roomTypes = (data.roomTypes as NamedValueItem[]) || [];
  const sources = (data.sources as NamedValueItem[]) || [];
  const comparison =
    (data.comparison as {
      name: string;
      value: string | number;
      change?: string;
    }[]) || [];
  const rateHeatmap =
    (data.rateHeatmap as { name: string; values: number[] }[]) || [];
  const series = (data.series as Record<string, unknown>[]) || [];

  const weekdayBars = weekdays.map((w) => ({
    name: w.name,
    value: w.adr,
  }));
  return (
    <>
      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">ADR Trend</div>
          <div className="card-subtitle">
            Average daily rate for the selected period
          </div>
          <TrendChart
            data={series}
            lines={[{ key: "adr", name: "ADR (₹)", color: "#157a70" }]}
          />
        </div>
        <div className="card">
          <div className="card-title">ADR by Room Type</div>
          <div className="card-subtitle">
            Average daily rate by room category
          </div>
          <BarList
            rows={roomTypes.map((r) => ({
              name: r.name,
              value: r.adr,
              color: r.color,
            }))}
          />
        </div>
      </div>

      <div className="three-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">ADR by Booking Source</div>
          <div className="card-subtitle">
            Average daily rate across booking sources
          </div>
          <BarList
            rows={sources.map((s) => ({
              name: s.name,
              value: s.adr,
              color: s.color,
            }))}
          />
        </div>
        <div className="card">
          <div className="card-title">ADR by Day of Week</div>
          <div className="card-subtitle">Average daily rate for each day</div>
          <BarList rows={weekdayBars} />
        </div>
        <div className="card">
          <div className="card-title">ADR Comparison</div>
          <div className="card-subtitle">Compare ADR with previous period</div>
          <ComparisonCard rows={comparison} />
        </div>
      </div>

      <div className="card">
        <div className="card-title">ADR Heatmap</div>
        <div className="card-subtitle">ADR by day and room type</div>
        <HeatmapGrid rows={rateHeatmap} mode="rate" />
      </div>
    </>
  );
}

export default AdrDashboard;
