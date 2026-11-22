"use client";
import TrendChart from "../TrendChart";
import DonutBreakdown from "../DonutBreakdown";
import BarList from "../BarList";
import { money, num } from "../format";

function PeakHoursChart({ peakHours }) {
  const max = Math.max(...peakHours.map((h) => h.count), 1);
  return (
    <div
      style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 140 }}
    >
      {peakHours.map((h) => (
        <div
          key={h.hour}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            height: "100%",
          }}
        >
          <div
            style={{
              width: "70%",
              background: "var(--accent)",
              opacity: 0.25 + (h.count / max) * 0.75,
              borderRadius: "3px 3px 0 0",
              height: `${Math.max((h.count / max) * 100, 2)}%`,
            }}
          />
          {h.hour % 3 === 0 && (
            <span
              style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 4 }}
            >
              {h.hour % 12 === 0 ? 12 : h.hour % 12}
              {h.hour < 12 ? "A" : "P"}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function SalesDashboard({ data }) {
  return (
    <>
      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Sales Trend</div>
          <div className="card-subtitle">Daily sales by order type</div>
          <TrendChart
            data={data.series}
            lines={[
              { key: "total", name: "Total", color: "#157a70" },
              { key: "dine_in", name: "Dine-in", color: "#6b7cae" },
              {
                key: "online_delivery",
                name: "Online/Delivery",
                color: "#d47748",
              },
              { key: "takeaway", name: "Takeaway", color: "#b98b38" },
            ]}
          />
        </div>
        <div className="card">
          <div className="card-title">Sales by Order Type</div>
          <div className="card-subtitle">
            Distribution of sales by order type
          </div>
          <DonutBreakdown
            data={data.orderTypeBreakdown}
            centerLabel="Total Sales"
            centerValue={money(data.summary.totalSales)}
          />
        </div>
      </div>

      <div className="three-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Top Selling Items</div>
          <div className="card-subtitle">Items by revenue</div>
          <BarList
            rows={data.topItems.map((i) => ({
              name: i.name,
              value: i.revenue,
            }))}
          />
        </div>
        <div className="card">
          <div className="card-title">Sales by Category</div>
          <div className="card-subtitle">
            Category-wise revenue distribution
          </div>
          <BarList
            rows={data.categoryBreakdown.map((c) => ({
              name: c.name,
              value: c.revenue,
              color: c.color,
            }))}
          />
        </div>
        <div className="card">
          <div className="card-title">Payment Method</div>
          <div className="card-subtitle">Sales by payment method</div>
          <DonutBreakdown
            data={data.paymentMethods.map((p) => ({
              name: p.name,
              value: p.amount,
              color: p.color,
            }))}
            centerLabel="Total Sales"
            centerValue={money(data.summary.totalSales)}
          />
        </div>
      </div>

      <div className="two-col grid">
        <div className="card">
          <div className="card-title">Sales by Outlet</div>
          <div className="card-subtitle">Compare sales across outlets</div>
          <div className="table-wrap">
            <table className="table-simple">
              <thead>
                <tr>
                  <th>Outlet</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                  <th>Avg Order Value</th>
                  <th>Growth</th>
                </tr>
              </thead>
              <tbody>
                {data.outlets.map((o) => (
                  <tr key={o.name}>
                    <td>{o.name}</td>
                    <td>{num(o.orders)}</td>
                    <td>{money(o.revenue)}</td>
                    <td>{money(o.avgOrderValue)}</td>
                    <td
                      style={{
                        color: o.change.startsWith("-")
                          ? "var(--danger)"
                          : "var(--success)",
                      }}
                    >
                      {o.change}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Peak Hours</div>
          <div className="card-subtitle">Hourly sales distribution</div>
          <PeakHoursChart peakHours={data.peakHours} />
        </div>
      </div>
    </>
  );
}
