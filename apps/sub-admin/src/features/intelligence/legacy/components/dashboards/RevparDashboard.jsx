"use client";
import ComboChart from "../ComboChart";
import BarList from "../BarList";
import HeatmapGrid from "../HeatmapGrid";
import ComparisonCard from "../ComparisonCard";

export default function RevparDashboard({ data }) {
  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">RevPAR Trend</div>
        <div className="card-subtitle">Daily RevPAR vs ADR and Occupancy</div>
        <ComboChart
          data={data.series}
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
            rows={data.roomTypes.map((r) => ({
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
            rows={data.sources.map((s) => ({
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
            rows={data.weekdays.map((w) => ({ name: w.name, value: w.revpar }))}
          />
        </div>
      </div>

      <div className="two-col grid">
        <div className="card">
          <div className="card-title">RevPAR Heatmap</div>
          <div className="card-subtitle">
            Occupancy pattern by day and room type (the main driver of RevPAR)
          </div>
          <HeatmapGrid rows={data.revparHeatmap} mode="pct" />
        </div>
        <div className="card">
          <div className="card-title">RevPAR Comparison</div>
          <div className="card-subtitle">
            Compare RevPAR with previous period
          </div>
          <ComparisonCard rows={data.comparison} />
        </div>
      </div>
    </>
  );
}
