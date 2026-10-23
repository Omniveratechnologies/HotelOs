"use client";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { money, pctStr } from "../format";

const fmt = (v) =>
  Math.abs(v) >= 100000
    ? `${(v / 100000).toFixed(1)}L`
    : Math.abs(v) >= 1000
      ? `${(v / 1000).toFixed(1)}k`
      : v;

function RevenueForecastChart({ series }) {
  const rows = series.map((r) => ({
    ...r,
    band: [r.totalLower, r.totalUpper],
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart
        data={rows}
        margin={{ top: 6, right: 8, left: -18, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
          minTickGap={28}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={fmt}
          width={44}
        />
        <Tooltip
          formatter={(v, n) =>
            Array.isArray(v)
              ? [`${fmt(v[0])} – ${fmt(v[1])}`, "Confidence range"]
              : [fmt(v), n]
          }
          contentStyle={{
            borderRadius: 10,
            border: "1px solid #e8e4d9",
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          dataKey="band"
          name="Confidence Range"
          stroke="none"
          fill="#8B5CF6"
          fillOpacity={0.16}
        />
        <Line
          type="monotone"
          dataKey="total"
          name="Forecasted Revenue"
          stroke="#1E6FEB"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function BreakdownChart({ series }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart
        data={series}
        margin={{ top: 6, right: 8, left: -18, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
          minTickGap={28}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={fmt}
          width={44}
        />
        <Tooltip
          formatter={(v, n) => [fmt(v), n]}
          contentStyle={{
            borderRadius: 10,
            border: "1px solid #e8e4d9",
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar
          dataKey="pms"
          name="Rooms (PMS)"
          stackId="a"
          fill="#1E6FEB"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="pos"
          name="F&B (POS)"
          stackId="a"
          fill="#F59E0B"
          radius={[4, 4, 0, 0]}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default function ForecastDashboard({ data }) {
  return (
    <>
      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Revenue Forecast Trend</div>
          <div className="card-subtitle">
            Actual vs forecasted revenue (PMS + POS) with confidence range
          </div>
          <RevenueForecastChart series={data.series} />
        </div>
        <div className="card">
          <div className="card-title">Revenue Forecast Breakdown</div>
          <div className="card-subtitle">Forecasted revenue by source</div>
          <BreakdownChart series={data.series} />
        </div>
      </div>

      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Occupancy Forecast</div>
          <div className="card-subtitle">
            Expected occupancy rate and room revenue
          </div>
          <RevenueForecastChart
            series={data.series.map((r) => ({
              ...r,
              total: r.occupancy,
              totalLower: r.occupancy,
              totalUpper: r.occupancy,
            }))}
          />
        </div>
        <div className="card">
          <div className="card-title">F&amp;B Covers Forecast</div>
          <div className="card-subtitle">
            Expected restaurant covers and average spend
          </div>
          <BreakdownChart
            series={data.series.map((r) => ({
              day: r.day,
              pms: 0,
              pos: r.covers,
            }))}
          />
        </div>
      </div>

      <div className="two-col grid">
        <div className="card">
          <div className="card-title">Forecast by Revenue Source</div>
          <div className="card-subtitle">Monthly outlook with growth %</div>
          <div className="table-wrap">
            <table className="table-simple">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Room Revenue</th>
                  <th>F&amp;B Revenue</th>
                  <th>Total Revenue</th>
                  <th>Growth</th>
                </tr>
              </thead>
              <tbody>
                {data.bySource.map((r) => (
                  <tr key={r.period}>
                    <td>{r.period}</td>
                    <td>{money(r.pms)}</td>
                    <td>{money(r.pos)}</td>
                    <td>{money(r.total)}</td>
                    <td
                      style={{
                        color: r.growth.startsWith("-")
                          ? "var(--danger)"
                          : "var(--success)",
                      }}
                    >
                      {r.growth}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Daily Forecast (Next 7 Days)</div>
          <div className="card-subtitle">Occupancy, revenue and covers</div>
          <div className="table-wrap">
            <table className="table-simple">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Occupancy</th>
                  <th>Room Revenue</th>
                  <th>F&amp;B Revenue</th>
                  <th>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.next7.map((r) => (
                  <tr key={r.day}>
                    <td>{r.day}</td>
                    <td>{pctStr(r.occupancy)}</td>
                    <td>{money(r.pms)}</td>
                    <td>{money(r.pos)}</td>
                    <td>{money(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
