import { ForecastChart } from "../../shared/components/ForecastChart";
import { BarList } from "../../shared/components/BarList";
import { money, num, pctStr } from "../../shared/utils/formatters";
import type { DashboardData } from "../../shared/types";

interface DailyForecastRow {
  date: string;
  occupancy?: number;
  adr?: number;
  revpar?: number;
  bookings?: number;
  revenue?: number;
}

function DailyTable({ rows }: { rows: DailyForecastRow[] }) {
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

function MonthlyComparisonTable({ data }: { data: DashboardData }) {
  const summary =
    (data.summary as {
      occupancyPct?: number;
      adr?: number;
      revpar?: number;
      totalRevenue?: number;
      bookings?: number;
    }) || {};
  const forecastComparison =
    (data.forecastComparison as { value: string }[]) || [];

  const rows = [
    {
      metric: "Occupancy",
      actual: pctStr(summary.occupancyPct),
      forecast: forecastComparison[0]?.value ?? "—",
    },
    {
      metric: "ADR",
      actual: money(summary.adr),
      forecast: forecastComparison[1]?.value ?? "—",
    },
    {
      metric: "RevPAR",
      actual: money(summary.revpar),
      forecast: forecastComparison[2]?.value ?? "—",
    },
    {
      metric: "Total Revenue",
      actual: money(summary.totalRevenue),
      forecast: forecastComparison[3]?.value ?? "—",
    },
    {
      metric: "Total Bookings",
      actual: num(summary.bookings),
      forecast: forecastComparison[4]?.value ?? "—",
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

interface RoomTypeDemandItem {
  name: string;
  demand?: number;
  count?: number;
  color?: string;
}

export function ForecastDashboard({ data }: { data: DashboardData }) {
  const forecast = (data.forecast as Record<string, unknown>[]) || [];
  const roomTypes = (data.roomTypes as RoomTypeDemandItem[]) || [];
  const sources = (data.sources as RoomTypeDemandItem[]) || [];
  const nextWeek = (data.nextWeek as DailyForecastRow[]) || [];
  const range = typeof data.range === "string" ? data.range : "30d";

  return (
    <>
      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Occupancy Forecast</div>
          <div className="card-subtitle">
            Actual vs Forecasted occupancy for next{" "}
            {range === "12m" ? "365" : range.replace("d", "")} days
          </div>
          <ForecastChart
            data={forecast}
            metric="occupancy"
            color="#157a70"
            valueFormatter={(v) => `${Math.round(Number(v))}%`}
          />
        </div>
        <div className="card">
          <div className="card-title">Revenue Forecast</div>
          <div className="card-subtitle">Daily revenue forecast</div>
          <ForecastChart
            data={forecast}
            metric="revenue"
            color="#d47748"
            valueFormatter={(v) => money(Number(v))}
          />
        </div>
      </div>

      <div className="three-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">ADR Forecast</div>
          <div className="card-subtitle">Average Daily Rate prediction</div>
          <ForecastChart
            data={forecast}
            metric="adr"
            color="#6b7cae"
            height={220}
            valueFormatter={(v) => money(Number(v))}
          />
        </div>
        <div className="card">
          <div className="card-title">Forecasted Demand by Room Type</div>
          <div className="card-subtitle">
            Expected room nights for the period
          </div>
          <BarList
            rows={roomTypes.map((r) => ({
              name: r.name,
              value: r.demand ?? 0,
              color: r.color,
            }))}
            formatValue={(r) => num(r.value)}
          />
        </div>
        <div className="card">
          <div className="card-title">Forecasted Bookings by Source</div>
          <div className="card-subtitle">Expected number of bookings</div>
          <BarList
            rows={sources.map((s) => ({
              name: s.name,
              value: s.count ?? 0,
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
          <DailyTable rows={nextWeek} />
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

export default ForecastDashboard;
