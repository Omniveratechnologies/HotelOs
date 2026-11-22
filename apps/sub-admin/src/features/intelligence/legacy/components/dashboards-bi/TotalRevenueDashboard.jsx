"use client";
import TrendChart from "../TrendChart";
import DonutBreakdown from "../DonutBreakdown";
import BarList from "../BarList";
import { money, num } from "../format";

export default function TotalRevenueDashboard({ data }) {
  return (
    <>
      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Total Revenue Trend</div>
          <div className="card-subtitle">
            Daily revenue from PMS, POS and other sources
          </div>
          <TrendChart
            data={data.series}
            lines={[
              { key: "total", name: "Total", color: "#1E6FEB" },
              { key: "pms", name: "PMS (Rooms)", color: "#1E6FEB" },
              { key: "pos", name: "POS (F&B)", color: "#F59E0B" },
              { key: "other", name: "Other", color: "#8B5CF6" },
            ]}
            area={false}
          />
        </div>
        <div className="card">
          <div className="card-title">Revenue by Source</div>
          <div className="card-subtitle">Share of total revenue</div>
          <DonutBreakdown
            data={data.revenueBySource}
            centerLabel="Total Revenue"
            centerValue={money(data.summary.totalRevenue)}
          />
        </div>
      </div>

      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Revenue by Outlet / Property</div>
          <div className="card-subtitle">Rooms plus every POS outlet</div>
          <BarList rows={data.outlets} formatValue={(r) => money(r.value)} />
        </div>
        <div className="card">
          <div className="card-title">Payment Method Split</div>
          <div className="card-subtitle">Across PMS and POS transactions</div>
          <DonutBreakdown
            data={data.paymentMethods.map((p) => ({
              name: p.name,
              value: p.amount,
              color: p.color,
            }))}
            centerLabel="Total Transactions"
            centerValue={num(data.summary.totalTransactions)}
            valueIsMoney={false}
          />
        </div>
      </div>

      <div className="two-col grid">
        <div className="card">
          <div className="card-title">
            Top Revenue Generating Categories (POS)
          </div>
          <div className="card-subtitle">By items sold and revenue</div>
          <div className="table-wrap">
            <table className="table-simple">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Category</th>
                  <th>Items Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topCategories.map((c, i) => (
                  <tr key={c.name}>
                    <td>{i + 1}</td>
                    <td>{c.name}</td>
                    <td>{num(c.quantity)}</td>
                    <td>{money(c.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Top Room Types (PMS)</div>
          <div className="card-subtitle">By nights sold and revenue</div>
          <div className="table-wrap">
            <table className="table-simple">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Room Type</th>
                  <th>Nights Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topRoomTypes.map((r, i) => (
                  <tr key={r.name}>
                    <td>{i + 1}</td>
                    <td>{r.name}</td>
                    <td>{num(r.nights)}</td>
                    <td>{money(r.revenue)}</td>
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
