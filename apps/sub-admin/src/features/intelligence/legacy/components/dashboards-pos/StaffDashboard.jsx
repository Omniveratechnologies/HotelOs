"use client";
import TrendChart from "../TrendChart";
import DonutBreakdown from "../DonutBreakdown";
import BarList from "../BarList";
import { money, num } from "../format";

export default function StaffDashboard({ data }) {
  const palette = ["#157a70", "#d47748", "#6b7cae", "#b98b38", "#478a66"];
  const lines = data.top5Names.map((name, i) => ({
    key: name,
    name,
    color: palette[i % palette.length],
  }));
  return (
    <>
      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Staff Sales Performance</div>
          <div className="card-subtitle">Daily sales by staff (Top 5)</div>
          <TrendChart
            data={data.series}
            lines={lines}
            area={false}
            valueFormatter={money}
          />
        </div>
        <div className="card">
          <div className="card-title">Staff-wise Order Contribution</div>
          <div className="card-subtitle">
            Number of orders handled by each staff member
          </div>
          <BarList
            rows={data.contribution.map((c) => ({
              name: c.name,
              value: c.value,
              color: c.color,
            }))}
            formatValue={(r) => num(r.value)}
          />
        </div>
      </div>

      <div className="three-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Top Performing Staff</div>
          <div className="card-subtitle">
            Based on sales, orders and ratings
          </div>
          <div className="table-wrap">
            <table className="table-simple">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Role</th>
                  <th>Orders</th>
                  <th>Sales</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {data.table.map((s) => (
                  <tr key={s.name}>
                    <td>{s.name}</td>
                    <td>{s.role}</td>
                    <td>{num(s.orders)}</td>
                    <td>{money(s.sales)}</td>
                    <td>{s.rating ? s.rating.toFixed(1) : "—"} ★</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Service Time by Staff</div>
          <div className="card-subtitle">
            Average time to prepare / deliver orders
          </div>
          <div className="table-wrap">
            <table className="table-simple">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Order Time</th>
                  <th>Delivery Time</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.serviceTime.map((s) => (
                  <tr key={s.name}>
                    <td>{s.name}</td>
                    <td>{s.avgOrderTime.toFixed(1)} min</td>
                    <td>
                      {s.avgDeliveryTime
                        ? `${s.avgDeliveryTime.toFixed(1)} min`
                        : "—"}
                    </td>
                    <td>{s.totalTime.toFixed(1)} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Customer Ratings by Staff</div>
          <div className="card-subtitle">Average customer feedback rating</div>
          <BarList
            rows={data.ratings.map((r) => ({ name: r.name, value: r.rating }))}
            formatValue={(r) => `${r.value.toFixed(1)} ★`}
          />
        </div>
      </div>

      <div className="two-col grid">
        <div className="card">
          <div className="card-title">Staff Attendance</div>
          <div className="card-subtitle">
            Present, absent and leave status for the selected period
          </div>
          <DonutBreakdown
            data={data.attendance}
            centerLabel="Total Staff"
            centerValue={num(data.summary.totalStaff)}
            valueIsMoney={false}
          />
        </div>
        <div className="card">
          <div className="card-title">Sales by Staff Role</div>
          <div className="card-subtitle">Total sales contribution by role</div>
          <DonutBreakdown
            data={data.byRole}
            centerLabel="Total Sales"
            centerValue={money(data.summary.totalStaffSales)}
          />
        </div>
      </div>
    </>
  );
}
