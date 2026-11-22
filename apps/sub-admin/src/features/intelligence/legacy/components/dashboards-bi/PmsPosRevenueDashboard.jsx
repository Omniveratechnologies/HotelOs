"use client";
import TrendChart from "../TrendChart";
import DonutBreakdown from "../DonutBreakdown";
import ComparisonCard from "../ComparisonCard";
import { money } from "../format";

export default function PmsPosRevenueDashboard({ data }) {
  return (
    <>
      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">PMS vs POS Revenue Trend</div>
          <div className="card-subtitle">
            Daily revenue comparison for the selected period
          </div>
          <TrendChart
            data={data.series}
            lines={[
              { key: "pms", name: "PMS Revenue", color: "#1E6FEB" },
              { key: "pos", name: "POS Revenue", color: "#F59E0B" },
              { key: "total", name: "Total Revenue", color: "#10B981" },
            ]}
            area={false}
          />
        </div>
        <div className="card">
          <div className="card-title">Revenue Share (PMS vs POS)</div>
          <div className="card-subtitle">Distribution of total revenue</div>
          <DonutBreakdown
            data={data.revenueShare}
            centerLabel="Total Revenue"
            centerValue={money(
              data.summary.pmsRevenue + data.summary.posRevenue,
            )}
          />
        </div>
      </div>

      <div className="three-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">PMS vs POS by Day Type</div>
          <div className="card-subtitle">
            Compare revenue on weekdays vs weekends
          </div>
          <TrendChart
            data={data.byDayType}
            lines={[
              { key: "pms", name: "PMS", color: "#1E6FEB" },
              { key: "pos", name: "POS", color: "#F59E0B" },
            ]}
            area={false}
          />
        </div>
        <div className="card">
          <div className="card-title">Revenue by Guest Type</div>
          <div className="card-subtitle">
            PMS + POS revenue split by guest type
          </div>
          <DonutBreakdown
            data={data.guestType}
            centerLabel="Total Revenue"
            centerValue={money(
              data.summary.pmsRevenue + data.summary.posRevenue,
            )}
          />
        </div>
        <div className="card">
          <div className="card-title">Monthly Comparison</div>
          <div className="card-subtitle">Compare with the previous period</div>
          <ComparisonCard rows={data.comparison} />
        </div>
      </div>

      <div className="card">
        <div className="card-title">Daily Revenue Breakdown</div>
        <div className="card-subtitle">
          Detailed PMS and POS revenue for each day
        </div>
        <div className="table-wrap">
          <table className="table-simple">
            <thead>
              <tr>
                <th>Date</th>
                <th>PMS Revenue</th>
                <th>POS Revenue</th>
                <th>Total Revenue</th>
                <th>PMS %</th>
                <th>POS %</th>
              </tr>
            </thead>
            <tbody>
              {data.dailyTable.map((r) => (
                <tr key={r.date}>
                  <td>{r.date}</td>
                  <td>{money(r.pms)}</td>
                  <td>{money(r.pos)}</td>
                  <td>{money(r.total)}</td>
                  <td>{r.pmsPct.toFixed(1)}%</td>
                  <td>{r.posPct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
