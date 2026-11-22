"use client";
import TrendChart from "../TrendChart";
import DonutBreakdown from "../DonutBreakdown";
import { money, num } from "../format";

const STATUS_BADGE = {
  completed: "low",
  out_for_delivery: "medium",
  preparing: "medium",
  pending: "medium",
  cancelled: "high",
};
const STATUS_LABEL = {
  completed: "Completed",
  out_for_delivery: "Out for Delivery",
  preparing: "Preparing",
  pending: "Pending",
  cancelled: "Cancelled",
};

export default function OrdersDashboard({ data }) {
  return (
    <>
      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Orders Trend</div>
          <div className="card-subtitle">Hourly and daily order volume</div>
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
            area={false}
            valueFormatter={num}
          />
        </div>
        <div className="card">
          <div className="card-title">Orders by Type</div>
          <div className="card-subtitle">
            Distribution of orders by order type
          </div>
          <DonutBreakdown
            data={data.orderTypeBreakdown}
            centerLabel="Total Orders"
            centerValue={num(data.summary.totalOrders)}
            valueIsMoney={false}
          />
        </div>
      </div>

      <div className="three-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Recent Orders</div>
          <div className="card-subtitle">
            Latest 10 orders across all outlets
          </div>
          <div className="table-wrap">
            <table className="table-simple">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Source</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>
                      {new Date(o.time).toLocaleTimeString("en-IN", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>{o.type}</td>
                    <td>{o.source}</td>
                    <td>{o.items}</td>
                    <td>{money(o.amount)}</td>
                    <td>
                      <span
                        className={`badge ${STATUS_BADGE[o.status] || "medium"}`}
                      >
                        {STATUS_LABEL[o.status] || o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Order Status Distribution</div>
          <div className="card-subtitle">Current status of all orders</div>
          <DonutBreakdown
            data={data.statusBreakdown}
            centerLabel="Total Orders"
            centerValue={num(data.summary.totalOrders)}
            valueIsMoney={false}
          />
        </div>
        <div className="card">
          <div className="card-title">Average Order Value Trend</div>
          <div className="card-subtitle">
            Trend of average order value over time
          </div>
          <TrendChart
            data={data.series}
            lines={[{ key: "aov", name: "AOV (₹)", color: "#478a66" }]}
            valueFormatter={money}
          />
        </div>
      </div>

      <div className="two-col grid">
        <div className="card">
          <div className="card-title">Top Ordered Items</div>
          <div className="card-subtitle">
            Items ordered the most number of times
          </div>
          <div className="table-wrap">
            <table className="table-simple">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Orders</th>
                  <th>Quantity</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topItems.map((i) => (
                  <tr key={i.name}>
                    <td>{i.name}</td>
                    <td>{num(i.orders)}</td>
                    <td>{num(i.quantity)}</td>
                    <td>{money(i.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Orders by Time of Day</div>
          <div className="card-subtitle">
            Number of orders in different time slots
          </div>
          <TrendChart
            data={data.peakHours.map((h) => ({
              day: `${h.hour % 12 === 0 ? 12 : h.hour % 12}${h.hour < 12 ? "AM" : "PM"}`,
              count: h.count,
            }))}
            lines={[{ key: "count", name: "Orders", color: "#157a70" }]}
            area
            valueFormatter={num}
          />
        </div>
      </div>
    </>
  );
}
