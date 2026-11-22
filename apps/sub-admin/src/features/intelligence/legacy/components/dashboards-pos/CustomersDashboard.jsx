"use client";
import TrendChart from "../TrendChart";
import DonutBreakdown from "../DonutBreakdown";
import BarList from "../BarList";
import { money, num } from "../format";

function Funnel({ segments }) {
  const max = Math.max(...segments.map((s) => s.count), 1);
  return (
    <div>
      {segments.map((s) => (
        <div key={s.name} style={{ marginBottom: 10 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12.5,
              marginBottom: 4,
            }}
          >
            <span style={{ color: "var(--text-muted)" }}>{s.name}</span>
            <span style={{ fontWeight: 700 }}>{num(s.count)}</span>
          </div>
          <div style={{ height: 10, borderRadius: 6, background: "#f1efe8" }}>
            <div
              style={{
                height: "100%",
                borderRadius: 6,
                width: `${Math.max((s.count / max) * 100, 4)}%`,
                background: s.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CustomersDashboard({ data }) {
  return (
    <>
      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">New vs Returning Customers</div>
          <div className="card-subtitle">Daily customer count over time</div>
          <TrendChart
            data={data.series}
            lines={[
              { key: "newCustomers", name: "New Customers", color: "#157a70" },
              {
                key: "returningCustomers",
                name: "Returning Customers",
                color: "#6b7cae",
              },
            ]}
            area={false}
            valueFormatter={num}
          />
        </div>
        <div className="card">
          <div className="card-title">Customer Type Distribution</div>
          <div className="card-subtitle">Share of customers by order type</div>
          <DonutBreakdown
            data={data.customerTypeMix}
            centerLabel="Total Customers"
            centerValue={num(data.summary.totalCustomers)}
            valueIsMoney={false}
          />
        </div>
      </div>

      <div className="three-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Top Customers by Spend</div>
          <div className="card-subtitle">
            Customers who spent the most this period
          </div>
          <div className="table-wrap">
            <table className="table-simple">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Visits</th>
                  <th>Total Spend</th>
                </tr>
              </thead>
              <tbody>
                {data.topCustomers.map((c) => (
                  <tr key={c.name}>
                    <td>{c.name}</td>
                    <td>{num(c.visits)}</td>
                    <td>{money(c.totalSpend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-title">
            Customer Segments (by Lifetime Value)
          </div>
          <div className="card-subtitle">
            Distribution of customers by total spend
          </div>
          <Funnel segments={data.segments} />
        </div>
        <div className="card">
          <div className="card-title">Visit Frequency</div>
          <div className="card-subtitle">How often customers visit</div>
          <BarList
            rows={data.visitFrequency.map((v) => ({
              name: v.name,
              value: v.count,
            }))}
            formatValue={(r) => num(r.value)}
          />
        </div>
      </div>

      <div className="two-col grid">
        <div className="card">
          <div className="card-title">Customer Acquisition Source</div>
          <div className="card-subtitle">Where customers come from</div>
          <DonutBreakdown
            data={data.acquisition}
            centerLabel="Total Customers"
            centerValue={num(data.summary.totalCustomers)}
            valueIsMoney={false}
          />
        </div>
        <div className="card">
          <div className="card-title">Customer Growth Trend</div>
          <div className="card-subtitle">
            Cumulative new customers over time
          </div>
          <TrendChart
            data={data.growthTrend}
            lines={[
              {
                key: "totalCustomers",
                name: "Total Customers",
                color: "#157a70",
              },
              {
                key: "newCustomers",
                name: "New Customers",
                color: "#d47748",
                dashed: true,
              },
            ]}
            area={false}
            valueFormatter={num}
          />
        </div>
      </div>
    </>
  );
}
