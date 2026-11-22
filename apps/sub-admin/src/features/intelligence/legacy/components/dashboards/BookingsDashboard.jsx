"use client";
import TrendChart from "../TrendChart";
import DonutBreakdown from "../DonutBreakdown";
import BarList from "../BarList";
import { num } from "../format";

export default function BookingsDashboard({ data }) {
  const sourceDonut = data.sources.map((s) => ({
    name: s.name,
    value: s.count,
    color: s.color,
  }));
  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Booking Trends</div>
        <div className="card-subtitle">Daily bookings with booking status</div>
        <TrendChart
          data={data.series}
          lines={[
            { key: "bookings", name: "Total", color: "#157a70" },
            { key: "confirmed", name: "Confirmed", color: "#478a66" },
            { key: "pending", name: "Pending", color: "#b98b38" },
            { key: "cancelled", name: "Cancelled", color: "#d0483f" },
            { key: "noShows", name: "No-show", color: "#9b6a8d" },
          ]}
          area={false}
        />
      </div>

      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Bookings by Source</div>
          <div className="card-subtitle">
            Where your bookings are coming from
          </div>
          <DonutBreakdown
            data={sourceDonut}
            centerLabel="Total Bookings"
            centerValue={num(data.summary.bookings)}
            valueIsMoney={false}
          />
        </div>
        <div className="card">
          <div className="card-title">Bookings by Room Type</div>
          <div className="card-subtitle">
            Number of bookings by room category
          </div>
          <BarList
            rows={data.roomTypes.map((r) => ({
              name: r.name,
              value: r.bookings,
              color: r.color,
            }))}
            formatValue={(r) => num(r.value)}
          />
        </div>
      </div>

      <div className="two-col grid">
        <div className="card">
          <div className="card-title">Booking Lead Time</div>
          <div className="card-subtitle">
            How early guests are booking (days in advance)
          </div>
          <BarList
            rows={data.leadTime.map((l) => ({ name: l.name, value: l.count }))}
            formatValue={(r) => `${num(r.value)}`}
          />
        </div>
        <div className="card">
          <div className="card-title">Stay Duration</div>
          <div className="card-subtitle">Distribution of length of stay</div>
          <BarList
            rows={data.stayDuration.map((s) => ({
              name: s.name,
              value: s.count,
            }))}
            formatValue={(r) => `${num(r.value)}`}
          />
        </div>
      </div>
    </>
  );
}
