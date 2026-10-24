"use client";
import TrendChart from "../TrendChart";
import DonutBreakdown from "../DonutBreakdown";
import BarList from "../BarList";
import { money } from "../format";

export default function GuestSpendingDashboard({ data }) {
  return (
    <>
      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Guest Spending Trend</div>
          <div className="card-subtitle">
            Daily average and total spending per hotel guest
          </div>
          <TrendChart
            data={data.series}
            lines={[
              {
                key: "avgSpend",
                name: "Avg Spend per Guest",
                color: "#1E6FEB",
              },
              {
                key: "totalSpend",
                name: "Total Guest Spend",
                color: "#F59E0B",
              },
            ]}
            area={false}
          />
        </div>
        <div className="card">
          <div className="card-title">Guest Spending by Category</div>
          <div className="card-subtitle">
            Share of hotel guest total spending (excluding room stay)
          </div>
          <DonutBreakdown
            data={data.categoryBreakdown}
            centerLabel="Total POS Spend"
            centerValue={money(data.summary.posSpendTotal)}
          />
        </div>
      </div>

      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Average Guest Spend by Stay Type</div>
          <div className="card-subtitle">
            Comparing spending pattern by length of stay
          </div>
          <TrendChart
            data={data.byStayType.map((s) => ({
              day: s.name,
              room: s.roomSpend,
              pos: s.posSpend,
            }))}
            lines={[
              { key: "room", name: "Room Spend", color: "#1E6FEB" },
              { key: "pos", name: "POS Spend", color: "#F59E0B" },
            ]}
            area={false}
          />
        </div>
        <div className="card">
          <div className="card-title">Guest Spend by Guest Type</div>
          <div className="card-subtitle">
            How different guest segments spend
          </div>
          <TrendChart
            data={data.byGuestType.map((s) => ({
              day: s.name,
              room: s.roomSpend,
              pos: s.posSpend,
            }))}
            lines={[
              { key: "room", name: "Room Spend", color: "#1E6FEB" },
              { key: "pos", name: "POS Spend", color: "#F59E0B" },
            ]}
            area={false}
          />
        </div>
      </div>

      <div className="two-col grid">
        <div className="card">
          <div className="card-title">Top Guests by Spending</div>
          <div className="card-subtitle">
            Hotel guests with highest total spending (Room + POS)
          </div>
          <div className="table-wrap">
            <table className="table-simple">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Guest Name</th>
                  <th>Room Spend</th>
                  <th>POS Spend</th>
                  <th>Total Spend</th>
                  <th>Nights</th>
                </tr>
              </thead>
              <tbody>
                {data.topGuests.map((g, i) => (
                  <tr key={g.name + i}>
                    <td>{i + 1}</td>
                    <td>{g.name}</td>
                    <td>{money(g.roomSpend)}</td>
                    <td>{money(g.posSpend)}</td>
                    <td>{money(g.totalSpend)}</td>
                    <td>{g.nights}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Top Rooms by Guest Spending</div>
          <div className="card-subtitle">
            Rooms with highest additional spending (excluding room revenue)
          </div>
          <BarList
            rows={data.topRooms.map((r) => ({
              name: r.name,
              value: r.posSpend,
            }))}
          />
        </div>
      </div>
    </>
  );
}
