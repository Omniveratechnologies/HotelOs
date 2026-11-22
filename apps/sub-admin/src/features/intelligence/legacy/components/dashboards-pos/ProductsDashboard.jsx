"use client";
import TrendChart from "../TrendChart";
import DonutBreakdown from "../DonutBreakdown";
import BarList from "../BarList";
import { money, num } from "../format";

function HourWeekdayHeatmap({ rows }) {
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const max = Math.max(...rows.flatMap((r) => r.values), 1);
  return (
    <div>
      <div className="heatmap-grid" style={{ marginBottom: 4 }}>
        <div />
        {DAYS.map((d) => (
          <div
            key={d}
            className="heatmap-label"
            style={{ justifyContent: "center" }}
          >
            {d}
          </div>
        ))}
      </div>
      {rows.map((row) => (
        <div
          className="heatmap-grid"
          key={row.name}
          style={{ marginBottom: 4 }}
        >
          <div className="heatmap-label" style={{ fontSize: 10.5 }}>
            {row.name}
          </div>
          {row.values.map((v, i) => {
            const t = v / max;
            return (
              <div
                key={i}
                className="heatmap-cell"
                style={{
                  background: `rgba(21,122,112,${0.12 + t * 0.78})`,
                  color: t > 0.5 ? "#fff" : "var(--text)",
                }}
              >
                {v}
              </div>
            );
          })}
        </div>
      ))}
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
        Low → High demand (items sold)
      </div>
    </div>
  );
}

export default function ProductsDashboard({ data }) {
  return (
    <>
      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Product Sales Trend</div>
          <div className="card-subtitle">
            Items sold and product revenue over time
          </div>
          <TrendChart
            data={data.series}
            lines={[
              { key: "quantity", name: "Items Sold", color: "#157a70" },
              { key: "revenue", name: "Revenue (₹)", color: "#d47748" },
            ]}
            area={false}
          />
        </div>
        <div className="card">
          <div className="card-title">Product Category Distribution</div>
          <div className="card-subtitle">Share of items sold by category</div>
          <DonutBreakdown
            data={data.categoryDistribution}
            centerLabel="Items Sold"
            centerValue={num(data.summary.itemsSold)}
            valueIsMoney={false}
          />
        </div>
      </div>

      <div className="three-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Top Selling Products</div>
          <div className="card-subtitle">
            Products with highest quantity sold
          </div>
          <div className="table-wrap">
            <table className="table-simple">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((p) => (
                  <tr key={p.name}>
                    <td>{p.name}</td>
                    <td>{p.category}</td>
                    <td>{num(p.quantity)}</td>
                    <td>{money(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Product Performance (Revenue)</div>
          <div className="card-subtitle">Top products by revenue generated</div>
          <BarList
            rows={data.topProducts.map((p) => ({
              name: p.name,
              value: p.revenue,
            }))}
          />
        </div>
        <div className="card">
          <div className="card-title">Low Performing Products</div>
          <div className="card-subtitle">
            Products with lowest quantity sold
          </div>
          <div className="table-wrap">
            <table className="table-simple">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>
                {data.lowProducts.map((p) => (
                  <tr key={p.name}>
                    <td>{p.name}</td>
                    <td>{p.category}</td>
                    <td>{num(p.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="two-col grid">
        <div className="card">
          <div className="card-title">Sales by Category</div>
          <div className="card-subtitle">
            Category-wise items sold and revenue
          </div>
          <div className="table-wrap">
            <table className="table-simple">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Items Sold</th>
                  <th>Revenue</th>
                  <th>Avg Item Price</th>
                </tr>
              </thead>
              <tbody>
                {data.categoryTable.map((c) => (
                  <tr key={c.name}>
                    <td>{c.name}</td>
                    <td>{num(c.quantity)}</td>
                    <td>{money(c.revenue)}</td>
                    <td>{money(c.avgItemPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Demand by Time of Day</div>
          <div className="card-subtitle">When products are sold the most</div>
          <HourWeekdayHeatmap rows={data.hourHeatmap} />
        </div>
      </div>
    </>
  );
}
