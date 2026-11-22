"use client";
import TrendChart from "../TrendChart";
import DonutBreakdown from "../DonutBreakdown";
import BarList from "../BarList";
import { num, pctStr } from "../format";

export default function GuestsDashboard({ data }) {
  return (
    <>
      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Guest Trend</div>
          <div className="card-subtitle">Guest arrivals over time</div>
          <TrendChart
            data={data.series}
            lines={[{ key: "guests", name: "Guests", color: "#157a70" }]}
            valueFormatter={num}
          />
        </div>
        <div className="card">
          <div className="card-title">Guest Type Distribution</div>
          <div className="card-subtitle">Share of new vs returning guests</div>
          <DonutBreakdown
            data={data.guestMix}
            centerLabel="Total Guests"
            centerValue={num(data.summary.guests)}
            valueIsMoney={false}
          />
        </div>
      </div>

      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Guest Nationality</div>
          <div className="card-subtitle">Top 5 nationalities</div>
          <BarList
            rows={data.nationality.map((n) => ({
              name: n.name,
              value: n.count,
              color: n.color,
            }))}
            formatValue={(r) => num(r.value)}
          />
        </div>
        <div className="card">
          <div className="card-title">Top Guest Cities</div>
          <div className="card-subtitle">Guests by city of origin</div>
          <BarList
            rows={data.cities.map((c) => ({
              name: c.name,
              value: c.count,
              color: c.color,
            }))}
            formatValue={(r) => num(r.value)}
          />
        </div>
      </div>

      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Guests by Age Group</div>
          <div className="card-subtitle">Distribution of guests by age</div>
          <BarList
            rows={data.ageGroups.map((a) => ({ name: a.name, value: a.count }))}
            formatValue={(r) => num(r.value)}
          />
        </div>
        <div className="card">
          <div className="card-title">Purpose of Visit</div>
          <div className="card-subtitle">
            Why guests are staying at your hotel
          </div>
          <BarList
            rows={data.purpose.map((p) => ({
              name: p.name,
              value: p.count,
              color: p.color,
            }))}
            formatValue={(r) => num(r.value)}
          />
        </div>
      </div>

      <div className="two-col grid">
        <div className="card">
          <div className="card-title">Repeat Guest Analysis</div>
          <div className="card-subtitle">
            Returning guest rate and frequency
          </div>
          <div style={{ display: "flex", gap: 26, flexWrap: "wrap" }}>
            <Stat
              label="Return rate"
              value={pctStr(data.repeatAnalysis.returningRate)}
            />
            <Stat
              label="Avg bookings / returning guest"
              value={data.repeatAnalysis.averageBookings.toFixed(1)}
            />
            <Stat
              label="Avg spend by returning guest"
              value={data.repeatAnalysis.averageSpend}
            />
          </div>
        </div>
        <div className="card">
          <div className="card-title">Guest Stay Duration</div>
          <div className="card-subtitle">Distribution of length of stay</div>
          <BarList
            rows={data.stayDuration.map((s) => ({
              name: s.name,
              value: s.count,
            }))}
            formatValue={(r) => num(r.value)}
          />
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
