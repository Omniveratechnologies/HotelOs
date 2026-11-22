"use client";
import TrendChart from "../TrendChart";
import DonutBreakdown from "../DonutBreakdown";
import BarList from "../BarList";
import HeatmapGrid from "../HeatmapGrid";
import { pctStr } from "../format";

export default function OccupancyDashboard({ data }) {
  const sourceDonut = data.sources.map((s) => ({
    name: s.name,
    value: s.count,
    color: s.color,
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
            data={data.series}
            lines={[
              { key: "occupancyPct", name: "Occupancy %", color: "#157a70" },
            ]}
            yFormatter={(v) => `${v}%`}
            valueFormatter={pctStr}
          />
        </div>
        <div className="card">
          <div className="card-title">Occupancy by Room Type</div>
          <div className="card-subtitle">Occupancy rate by room category</div>
          <BarList
            rows={data.roomTypes.map((r) => ({
              name: r.name,
              value: r.occupancy,
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
            centerValue={pctStr(data.summary.occupancyPct)}
            valueIsMoney={false}
          />
        </div>
        <div className="card">
          <div className="card-title">Occupancy Heatmap</div>
          <div className="card-subtitle">
            Room occupancy rate by day and room type
          </div>
          <HeatmapGrid rows={data.heatmap} mode="pct" />
        </div>
      </div>
    </>
  );
}
