import { TrendChart } from "../../shared/components/TrendChart";
import { DonutBreakdown } from "../../shared/components/DonutBreakdown";
import { BarList } from "../../shared/components/BarList";
import { num } from "../../shared/utils/formatters";
import type { DashboardData } from "../../shared/types";

interface NamedCountItem {
  name: string;
  count: number;
  color?: string;
  bookings?: number;
}

export function BookingsDashboard({ data }: { data: DashboardData }) {
  const sources = (data.sources as NamedCountItem[]) || [];
  const roomTypes = (data.roomTypes as NamedCountItem[]) || [];
  const leadTime = (data.leadTime as NamedCountItem[]) || [];
  const stayDuration = (data.stayDuration as NamedCountItem[]) || [];
  const summary = (data.summary as { bookings?: number }) || {};
  const series = (data.series as Record<string, unknown>[]) || [];

  const sourceDonut = sources.map((s) => ({
    name: s.name,
    value: s.count,
    color: s.color || "#157a70",
  }));
  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Booking Trends</div>
        <div className="card-subtitle">Daily bookings with booking status</div>
        <TrendChart
          data={series}
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
            centerValue={num(summary.bookings)}
            valueIsMoney={false}
          />
        </div>
        <div className="card">
          <div className="card-title">Bookings by Room Type</div>
          <div className="card-subtitle">
            Number of bookings by room category
          </div>
          <BarList
            rows={roomTypes.map((r) => ({
              name: r.name,
              value: r.bookings ?? 0,
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
            rows={leadTime.map((l) => ({ name: l.name, value: l.count }))}
            formatValue={(r) => `${num(r.value)}`}
          />
        </div>
        <div className="card">
          <div className="card-title">Stay Duration</div>
          <div className="card-subtitle">Distribution of length of stay</div>
          <BarList
            rows={stayDuration.map((s) => ({
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

export default BookingsDashboard;
