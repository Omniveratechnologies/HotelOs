"use client";
import TrendChart from "../TrendChart";
import DonutBreakdown from "../DonutBreakdown";
import BarList from "../BarList";
import { money } from "../format";

function marginColor(m) {
  return m >= 40
    ? "var(--success)"
    : m >= 30
      ? "var(--warning)"
      : "var(--danger)";
}

export default function ProfitabilityDashboard({ data }) {
  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Revenue, Cost &amp; Profit Trend</div>
        <div className="card-subtitle">
          Daily trend of revenue, cost and net profit
        </div>
        <TrendChart
          data={data.series}
          lines={[
            { key: "revenue", name: "Revenue", color: "#1E6FEB" },
            { key: "cost", name: "Cost", color: "#EF4444" },
            { key: "profit", name: "Net Profit", color: "#10B981" },
          ]}
        />
      </div>

      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Profitability by Revenue Source</div>
          <div className="card-subtitle">
            Contribution to profit and margin by business unit
          </div>
          <div className="table-wrap">
            <table className="table-simple">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Revenue</th>
                  <th>Cost</th>
                  <th>Profit</th>
                  <th>Margin</th>
                </tr>
              </thead>
              <tbody>
                {data.bySource.map((s) => (
                  <tr key={s.name}>
                    <td>{s.name}</td>
                    <td>{money(s.revenue)}</td>
                    <td>{money(s.cost)}</td>
                    <td>{money(s.profit)}</td>
                    <td
                      style={{ color: marginColor(s.margin), fontWeight: 700 }}
                    >
                      {s.margin.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Profit Margin by Outlet</div>
          <div className="card-subtitle">Margin percentage for each outlet</div>
          <BarList
            rows={data.byOutlet.map((o) => ({
              name: o.name,
              value: o.margin,
              color: o.color,
            }))}
            formatValue={(r) => `${r.value.toFixed(1)}%`}
          />
        </div>
      </div>

      <div className="three-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Profitability by Outlet / Area</div>
          <div className="card-subtitle">
            Revenue, cost and profit for each outlet
          </div>
          <div className="table-wrap">
            <table className="table-simple">
              <thead>
                <tr>
                  <th>Outlet</th>
                  <th>Revenue</th>
                  <th>Profit</th>
                  <th>Margin</th>
                </tr>
              </thead>
              <tbody>
                {data.byOutlet.map((o) => (
                  <tr key={o.name}>
                    <td>{o.name}</td>
                    <td>{money(o.revenue)}</td>
                    <td>{money(o.profit)}</td>
                    <td style={{ color: marginColor(o.margin) }}>
                      {o.margin.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Revenue Contribution</div>
          <div className="card-subtitle">Share of revenue by business unit</div>
          <DonutBreakdown
            data={data.revenueVsProfit.revenue}
            centerLabel="Total Revenue"
            centerValue={money(data.summary.totalRevenue)}
          />
        </div>
        <div className="card">
          <div className="card-title">Profit Contribution</div>
          <div className="card-subtitle">Share of profit by business unit</div>
          <DonutBreakdown
            data={data.revenueVsProfit.profit}
            centerLabel="Total Profit"
            centerValue={money(data.summary.netProfit)}
          />
        </div>
      </div>

      <div className="two-col grid">
        <div className="card">
          <div className="card-title">Top Profitable Items (F&amp;B)</div>
          <div className="card-subtitle">
            Menu items with highest profit margin
          </div>
          <div className="table-wrap">
            <table className="table-simple">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>Revenue</th>
                  <th>Cost</th>
                  <th>Profit</th>
                  <th>Margin</th>
                </tr>
              </thead>
              <tbody>
                {data.topItems.map((i, idx) => (
                  <tr key={i.name}>
                    <td>{idx + 1}</td>
                    <td>{i.name}</td>
                    <td>{money(i.revenue)}</td>
                    <td>{money(i.cost)}</td>
                    <td>{money(i.profit)}</td>
                    <td style={{ color: marginColor(i.margin) }}>
                      {i.margin.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Top Profitable Room Types</div>
          <div className="card-subtitle">
            Room types with highest profit margin
          </div>
          <div className="table-wrap">
            <table className="table-simple">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Room Type</th>
                  <th>Revenue</th>
                  <th>Profit</th>
                  <th>Margin</th>
                </tr>
              </thead>
              <tbody>
                {data.topRoomTypes.map((r, idx) => (
                  <tr key={r.name}>
                    <td>{idx + 1}</td>
                    <td>{r.name}</td>
                    <td>{money(r.revenue)}</td>
                    <td>{money(r.profit)}</td>
                    <td style={{ color: marginColor(r.margin) }}>
                      {r.margin.toFixed(1)}%
                    </td>
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
