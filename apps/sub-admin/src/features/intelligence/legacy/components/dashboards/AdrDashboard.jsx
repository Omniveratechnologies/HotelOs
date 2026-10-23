"use client";
import TrendChart from "../TrendChart";
import BarList from "../BarList";
import HeatmapGrid from "../HeatmapGrid";
import ComparisonCard from "../ComparisonCard";

export default function AdrDashboard({ data }) {
  const weekdayBars = data.weekdays.map((w) => ({
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
            data={data.series}
            lines={[{ key: "adr", name: "ADR (₹)", color: "#157a70" }]}
          />
        </div>
        <div className="card">
          <div className="card-title">ADR by Room Type</div>
          <div className="card-subtitle">
            Average daily rate by room category
          </div>
          <BarList
            rows={data.roomTypes.map((r) => ({
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
            rows={data.sources.map((s) => ({
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
          <ComparisonCard rows={data.comparison} />
        </div>
      </div>

      <div className="card">
        <div className="card-title">ADR Heatmap</div>
        <div className="card-subtitle">ADR by day and room type</div>
        <HeatmapGrid rows={data.rateHeatmap} mode="rate" />
      </div>
    </>
  );
}
