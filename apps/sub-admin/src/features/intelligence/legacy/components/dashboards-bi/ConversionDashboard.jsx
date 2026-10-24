"use client";
import ComboChart from "../ComboChart";
import { money, num, pctStr } from "../format";

function Funnel({ steps }) {
  const max = Math.max(...steps.map((s) => s.count), 1);
  const colors = ["#1E6FEB", "#8B5CF6", "#F59E0B"];
  return (
    <div>
      {steps.map((s, i) => (
        <div key={s.name} style={{ marginBottom: 14 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12.5,
              marginBottom: 5,
            }}
          >
            <span style={{ color: "var(--text-muted)" }}>{s.name}</span>
            <span style={{ fontWeight: 700 }}>
              {num(s.count)}{" "}
              {i > 0 ? `(${((s.count / max) * 100).toFixed(1)}%)` : "(100%)"}
            </span>
          </div>
          <div style={{ height: 14, borderRadius: 7, background: "#f1efe8" }}>
            <div
              style={{
                height: "100%",
                borderRadius: 7,
                width: `${Math.max((s.count / max) * 100, 4)}%`,
                background: colors[i % colors.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ConversionDashboard({ data }) {
  return (
    <>
      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Guest → Restaurant Conversion Trend</div>
          <div className="card-subtitle">
            Daily in-house guests vs dined guests and conversion rate
          </div>
          <ComboChart
            data={data.series}
            bar={{ key: "inHouse", name: "In-House Guests", color: "#1E6FEB" }}
            lines={[
              { key: "dined", name: "Dined Guests", color: "#10B981" },
              {
                key: "conversionRate",
                name: "Conversion Rate (%)",
                color: "#F59E0B",
                yAxisId: "right",
              },
            ]}
          />
        </div>
        <div className="card">
          <div className="card-title">Conversion Funnel</div>
          <div className="card-subtitle">
            From checked-in guests to restaurant revenue
          </div>
          <Funnel steps={data.funnel} />
        </div>
      </div>

      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Conversion by Guest Type</div>
          <div className="card-subtitle">
            Which guest types dine at the restaurant
          </div>
          <div className="table-wrap">
            <table className="table-simple">
              <thead>
                <tr>
                  <th>Guest Type</th>
                  <th>In-House</th>
                  <th>Dined</th>
                  <th>Conversion</th>
                </tr>
              </thead>
              <tbody>
                {data.byPurpose.map((p) => (
                  <tr key={p.name}>
                    <td>{p.name}</td>
                    <td>{num(p.inHouse)}</td>
                    <td>{num(p.dined)}</td>
                    <td>{pctStr(p.conversionRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Conversion by Room Type</div>
          <div className="card-subtitle">
            Restaurant conversion rate by room category
          </div>
          <div className="table-wrap">
            <table className="table-simple">
              <thead>
                <tr>
                  <th>Room Type</th>
                  <th>In-House</th>
                  <th>Dined</th>
                  <th>Conversion</th>
                  <th>Avg Spend</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.byRoomType.map((r) => (
                  <tr key={r.name}>
                    <td>{r.name}</td>
                    <td>{num(r.inHouse)}</td>
                    <td>{num(r.dined)}</td>
                    <td>{pctStr(r.conversionRate)}</td>
                    <td>{money(r.avgSpend)}</td>
                    <td>{money(r.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="two-col grid">
        <div className="card">
          <div className="card-title">
            Top Dining Outlets (by In-House Guests)
          </div>
          <div className="card-subtitle">
            Restaurant outlets with highest conversion
          </div>
          <div className="table-wrap">
            <table className="table-simple">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Outlet</th>
                  <th>Dined Guests</th>
                  <th>Conversion</th>
                  <th>Avg Spend</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topOutlets.map((o, i) => (
                  <tr key={o.name}>
                    <td>{i + 1}</td>
                    <td>{o.name}</td>
                    <td>{num(o.dined)}</td>
                    <td>{pctStr(o.conversionRate)}</td>
                    <td>{money(o.avgSpend)}</td>
                    <td>{money(o.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Top Dining Items (In-House Guests)</div>
          <div className="card-subtitle">
            Most ordered items by hotel guests
          </div>
          <div className="table-wrap">
            <table className="table-simple">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item Name</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topItems.map((it, i) => (
                  <tr key={it.name}>
                    <td>{i + 1}</td>
                    <td>{it.name}</td>
                    <td>{num(it.orders)}</td>
                    <td>{money(it.revenue)}</td>
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
