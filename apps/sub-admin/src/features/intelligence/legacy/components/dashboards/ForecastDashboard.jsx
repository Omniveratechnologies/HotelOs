"use client";
import ForecastChart from "../ForecastChart";
import BarList from "../BarList";
import { money, num, pctStr } from "../format";

function DailyTable({ rows }) {
  return (
    <div className="table-wrap">
      <table className="table-simple">
        <thead>
          <tr>
            <th>Date</th>
            <th>Occupancy</th>
            <th>ADR</th>
            <th>RevPAR</th>
            <th>Bookings</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.date}>
              <td>{r.date}</td>
              <td>{r.occupancy != null ? pctStr(r.occupancy) : "—"}</td>
              <td>{r.adr != null ? money(r.adr) : "—"}</td>
              <td>{r.revpar != null ? money(r.revpar) : "—"}</td>
              <td>{r.bookings != null ? Math.round(r.bookings) : "—"}</td>
              <td>{r.revenue != null ? money(r.revenue) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MonthlyComparisonTable({ data }) {
  const rows = [
    {
      metric: "Occupancy",
      actual: pctStr(data.summary.occupancyPct),
      forecast: data.forecastComparison[0].value,
    },
    {
      metric: "ADR",
      actual: money(data.summary.adr),
      forecast: data.forecastComparison[1].value,
    },
    {
      metric: "RevPAR",
      actual: money(data.summary.revpar),
      forecast: data.forecastComparison[2].value,
    },
    {
      metric: "Total Revenue",
      actual: money(data.summary.totalRevenue),
      forecast: data.forecastComparison[3].value,
    },
    {
      metric: "Total Bookings",
      actual: num(data.summary.bookings),
      forecast: data.forecastComparison[4].value,
    },
  ];
  return (
    <table className="comparison-table">
      <thead>
        <tr>
          <th>Metric</th>
          <th>This Period (Actual)</th>
          <th>Next Period (Forecast)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.metric}>
            <td style={{ color: "var(--text-muted)" }}>{r.metric}</td>
            <td style={{ fontWeight: 600 }}>{r.actual}</td>
            <td style={{ fontWeight: 700, color: "var(--accent)" }}>
              {r.forecast}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ForecastDashboard({ data }) {
  return (
    <>
      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Occupancy Forecast</div>
          <div className="card-subtitle">
            Actual vs Forecasted occupancy for next{" "}
            {data.range === "12m" ? "365" : data.range.replace("d", "")} days
          </div>
          <ForecastChart
            data={data.forecast}
            metric="occupancy"
            color="#157a70"
            valueFormatter={(v) => `${Math.round(v)}%`}
          />
        </div>
        <div className="card">
          <div className="card-title">Revenue Forecast</div>
          <div className="card-subtitle">Daily revenue forecast</div>
          <ForecastChart
            data={data.forecast}
            metric="revenue"
            color="#d47748"
            valueFormatter={money}
          />
        </div>
      </div>

      <div className="three-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">ADR Forecast</div>
          <div className="card-subtitle">Average Daily Rate prediction</div>
          <ForecastChart
            data={data.forecast}
            metric="adr"
            color="#6b7cae"
            height={220}
            valueFormatter={money}
          />
        </div>
        <div className="card">
          <div className="card-title">Forecasted Demand by Room Type</div>
          <div className="card-subtitle">
            Expected room nights for the period
          </div>
          <BarList
            rows={data.roomTypes.map((r) => ({
              name: r.name,
              value: r.demand,
              color: r.color,
            }))}
            formatValue={(r) => num(r.value)}
          />
        </div>
        <div className="card">
          <div className="card-title">Forecasted Bookings by Source</div>
          <div className="card-subtitle">Expected number of bookings</div>
          <BarList
            rows={data.sources.map((s) => ({
              name: s.name,
              value: s.count,
              color: s.color,
            }))}
            formatValue={(r) => num(r.value)}
          />
        </div>
      </div>

      <div className="two-col grid">
        <div className="card">
          <div className="card-title">Daily Forecast Summary</div>
          <div className="card-subtitle">Next 7 days</div>
          <DailyTable rows={data.nextWeek} />
        </div>
        <div className="card">
          <div className="card-title">Period Forecast Comparison</div>
          <div className="card-subtitle">
            Forecast vs this period&apos;s actuals
          </div>
          <MonthlyComparisonTable data={data} />
        </div>
      </div>
    </>
  );
}
