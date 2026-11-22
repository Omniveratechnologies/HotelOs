"use client";
import TrendChart from "../TrendChart";
import DonutBreakdown from "../DonutBreakdown";
import BarList from "../BarList";
import { money, num } from "../format";

export default function ClvDashboard({ data }) {
  return (
    <>
      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Customer Lifetime Value Trend</div>
          <div className="card-subtitle">
            Average CLV and total revenue from guests over time
          </div>
          <TrendChart
            data={data.trend}
            lines={[
              { key: "clv", name: "Avg CLV (₹)", color: "#1E6FEB" },
              {
                key: "totalRevenue",
                name: "Total Revenue (₹)",
                color: "#8B5CF6",
              },
            ]}
            area={false}
          />
        </div>
        <div className="card">
          <div className="card-title">Guest Segmentation by Lifetime Value</div>
          <div className="card-subtitle">
            Distribution of guests based on their lifetime value
          </div>
          <DonutBreakdown
            data={data.segmentation.map((s) => ({
              name: s.name,
              value: s.count,
              color: s.color,
            }))}
            centerLabel="Total Guests"
            centerValue={num(data.summary.totalGuests)}
            valueIsMoney={false}
          />
        </div>
      </div>

      <div className="three-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">CLV by Guest Type</div>
          <div className="card-subtitle">
            Average lifetime value across different guest segments
          </div>
          <BarList
            rows={data.byPurpose.map((p) => ({
              name: p.name,
              value: p.avgClv,
              color: p.color,
            }))}
          />
        </div>
        <div className="card">
          <div className="card-title">Top 10 Guests by Lifetime Value</div>
          <div className="card-subtitle">
            Guests who have generated the highest revenue over time
          </div>
          <div className="table-wrap">
            <table className="table-simple">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Guest Name</th>
                  <th>Total Stays</th>
                  <th>Total Spend</th>
                  <th>CLV</th>
                </tr>
              </thead>
              <tbody>
                {data.top10.map((g, i) => (
                  <tr key={g.name + i}>
                    <td>{i + 1}</td>
                    <td>{g.name}</td>
                    <td>{g.stays}</td>
                    <td>{money(g.totalSpend)}</td>
                    <td>{money(g.clv)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-title">
            Revenue Contribution by Guest Segment
          </div>
          <div className="card-subtitle">
            Share of total revenue from each segment
          </div>
          <DonutBreakdown
            data={data.revenueContribution}
            centerLabel="Total Revenue"
            centerValue={money(
              data.revenueContribution.reduce((s, r) => s + r.value, 0),
            )}
          />
        </div>
      </div>

      <div className="two-col grid">
        <div className="card">
          <div className="card-title">Repeat Guest Behavior</div>
          <div className="card-subtitle">
            Spending pattern comparison: first stay vs repeat stay
          </div>
          <BarList
            rows={[
              {
                name: "First Stay Avg Spend",
                value: data.repeatBehavior.firstStaySpend,
                color: "#8B5CF6",
              },
              {
                name: "Repeat Stay Avg Spend",
                value: data.repeatBehavior.repeatStaySpend,
                color: "#1E6FEB",
              },
            ]}
          />
        </div>
        <div className="card">
          <div className="card-title">CLV Distribution</div>
          <div className="card-subtitle">
            Number of guests in each lifetime value range
          </div>
          <BarList
            rows={data.distribution.map((d) => ({
              name: d.range,
              value: d.guests,
            }))}
            formatValue={(r) => num(r.value)}
          />
        </div>
      </div>
    </>
  );
}
