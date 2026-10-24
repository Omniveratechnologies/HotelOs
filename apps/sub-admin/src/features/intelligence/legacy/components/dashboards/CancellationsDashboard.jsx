"use client";
import TrendChart from "../TrendChart";
import DonutBreakdown from "../DonutBreakdown";
import BarList from "../BarList";
import ComparisonCard from "../ComparisonCard";
import { money, num } from "../format";

export default function CancellationsDashboard({ data }) {
  return (
    <>
      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Cancellation Trend</div>
          <div className="card-subtitle">
            Daily cancellation count and cancellation rate
          </div>
          <TrendChart
            data={data.cancellationTrend}
            lines={[
              { key: "cancellations", name: "Cancellations", color: "#d0483f" },
              { key: "cancellationRate", name: "Rate (%)", color: "#b98b38" },
            ]}
            area={false}
          />
        </div>
        <div className="card">
          <div className="card-title">Cancellations by Reason</div>
          <div className="card-subtitle">
            Main reasons for booking cancellations
          </div>
          <DonutBreakdown
            data={data.reasons}
            centerLabel="Cancellations"
            centerValue={num(data.summary.cancellations)}
            valueIsMoney={false}
          />
        </div>
      </div>

      <div className="three-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Cancellations by Booking Source</div>
          <div className="card-subtitle">
            Cancellations across different booking channels
          </div>
          <BarList
            rows={data.cancellationSources.map((s) => ({
              name: s.name,
              value: s.count,
              color: s.color,
            }))}
            formatValue={(r) => num(r.value)}
          />
        </div>
        <div className="card">
          <div className="card-title">Cancellations by Room Type</div>
          <div className="card-subtitle">Room type wise cancellation count</div>
          <BarList
            rows={data.roomTypes.map((r) => ({
              name: r.name,
              value: r.cancellations,
              color: r.color,
            }))}
            formatValue={(r) => num(r.value)}
          />
        </div>
        <div className="card">
          <div className="card-title">Cancellations by Lead Time</div>
          <div className="card-subtitle">
            How many days before check-in bookings are cancelled
          </div>
          <BarList
            rows={data.cancellationLeadTime.map((l) => ({
              name: l.name,
              value: l.count,
            }))}
            formatValue={(r) => num(r.value)}
          />
        </div>
      </div>

      <div className="two-col grid">
        <div className="card">
          <div className="card-title">Revenue Loss Analysis</div>
          <div className="card-subtitle">
            Estimated revenue lost due to cancellations
          </div>
          <TrendChart
            data={data.cancellationTrend}
            lines={[
              { key: "revenueLost", name: "Revenue Lost", color: "#d0483f" },
            ]}
            valueFormatter={money}
          />
        </div>
        <div className="card">
          <div className="card-title">Cancellation Comparison</div>
          <div className="card-subtitle">Compare with previous period</div>
          <ComparisonCard rows={data.comparison} />
        </div>
      </div>
    </>
  );
}
