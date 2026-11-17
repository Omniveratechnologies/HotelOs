import { TrendChart } from "../../shared/components/TrendChart";
import { DonutBreakdown } from "../../shared/components/DonutBreakdown";
import { BarList } from "../../shared/components/BarList";
import { HeatmapGrid } from "../../shared/components/HeatmapGrid";
import { pctStr } from "../../shared/utils/formatters";
import type { DashboardData } from "../../shared/types";

interface SourceItem {
  name: string;
  count: number;
  color?: string;
  occupancy?: number;
}

export function OccupancyDashboard({ data }: { data: DashboardData }) {
  const sources = (data.sources as SourceItem[]) || [];
  const roomTypes = (data.roomTypes as SourceItem[]) || [];
  const heatmap = (data.heatmap as { name: string; values: number[] }[]) || [];
  const summary = (data.summary as { occupancyPct?: number }) || {};
  const series = (data.series as Record<string, unknown>[]) || [];

  const sourceDonut = sources.map((s) => ({
    name: s.name,
    value: s.count,
    color: s.color || "#157a70",
  }));
  return (
    <>
      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Occupancy Trend</div>
          <div className="card-subtitle">
            Daily occupancy rate for the selected period
          </div>
          <TrendChart
            data={series}
            lines={[
              { key: "occupancyPct", name: "Occupancy %", color: "#157a70" },
            ]}
            yFormatter={(v) => `${v}%`}
            valueFormatter={(v) => pctStr(Number(v))}
          />
        </div>
        <div className="card">
          <div className="card-title">Occupancy by Room Type</div>
          <div className="card-subtitle">Occupancy rate by room category</div>
          <BarList
            rows={roomTypes.map((r) => ({
              name: r.name,
              value: r.occupancy ?? 0,
              color: r.color,
            }))}
            formatValue={(r) => pctStr(r.value)}
          />
        </div>
      </div>

      <div
        className="two-col grid"
        style={{ marginBottom: 16, gridTemplateColumns: "1fr 1.8fr" }}
      >
        <div className="card">
          <div className="card-title">Occupancy by Booking Source</div>
          <div className="card-subtitle">
            Where your occupied rooms are coming from
          </div>
          <DonutBreakdown
            data={sourceDonut}
            centerLabel="Occupancy"
            centerValue={pctStr(summary.occupancyPct)}
            valueIsMoney={false}
          />
        </div>
        <div className="card">
          <div className="card-title">Occupancy Heatmap</div>
          <div className="card-subtitle">
            Room occupancy rate by day and room type
          </div>
          <HeatmapGrid rows={heatmap} mode="pct" />
        </div>
      </div>
    </>
  );
}

export default OccupancyDashboard;
