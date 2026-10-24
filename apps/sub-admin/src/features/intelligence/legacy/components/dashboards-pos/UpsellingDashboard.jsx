"use client";
import ComboChart from "../ComboChart";
import DonutBreakdown from "../DonutBreakdown";
import { money, num, pctStr } from "../format";

export default function UpsellingDashboard({ data }) {
  return (
    <>
      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Upsell Revenue Trend</div>
          <div className="card-subtitle">
            Daily upsell revenue and order count
          </div>
          <ComboChart
            data={data.series}
            bar={{
              key: "revenue",
              name: "Upsell Revenue (₹)",
              color: "#157a70",
            }}
            lines={[
              {
                key: "orders",
                name: "Upsell Orders",
                color: "#d47748",
                yAxisId: "right",
              },
            ]}
          />
        </div>
        <div className="card">
          <div className="card-title">Upsell by Channel</div>
          <div className="card-subtitle">
            Share of upsell orders by order type
          </div>
          <DonutBreakdown
            data={data.channelBreakdown}
            centerLabel="Upsell Orders"
            centerValue={num(data.summary.upsellOrders)}
            valueIsMoney={false}
          />
        </div>
      </div>

      <div className="three-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Top Upsold Items</div>
          <div className="card-subtitle">
            Items most frequently added as upsell
          </div>
          <div className="table-wrap">
            <table className="table-simple">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Times Upsold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topUpsoldItems.map((i) => (
                  <tr key={i.name}>
                    <td>{i.name}</td>
                    <td>{num(i.timesUpsold)}</td>
                    <td>{money(i.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Best Performing Combos</div>
          <div className="card-subtitle">
            Item pairs most often ordered together
          </div>
          <div className="table-wrap">
            <table className="table-simple">
              <thead>
                <tr>
                  <th>Combo</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.combos.map((c) => (
                  <tr key={c.name}>
                    <td>{c.name}</td>
                    <td>{num(c.orders)}</td>
                    <td>{money(c.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Upsell by Staff</div>
          <div className="card-subtitle">Top performing staff in upselling</div>
          <div className="table-wrap">
            <table className="table-simple">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Upsell Orders</th>
                  <th>Revenue</th>
                  <th>Conversion</th>
                </tr>
              </thead>
              <tbody>
                {data.byStaff.map((s) => (
                  <tr key={s.name}>
                    <td>{s.name}</td>
                    <td>{num(s.orders)}</td>
                    <td>{money(s.revenue)}</td>
                    <td>{pctStr(s.conversionRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Upsell by Time of Day</div>
        <div className="card-subtitle">When upselling works best</div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 3,
            height: 120,
          }}
        >
          {data.peakHours.map((h) => {
            const max = Math.max(...data.peakHours.map((x) => x.count), 1);
            return (
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
                    background: "#478a66",
                    opacity: 0.3 + (h.count / max) * 0.7,
                    borderRadius: "3px 3px 0 0",
                    height: `${Math.max((h.count / max) * 100, 2)}%`,
                  }}
                />
                {h.hour % 3 === 0 && (
                  <span
                    style={{
                      fontSize: 9,
                      color: "var(--text-muted)",
                      marginTop: 4,
                    }}
                  >
                    {h.hour % 12 === 0 ? 12 : h.hour % 12}
                    {h.hour < 12 ? "A" : "P"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
