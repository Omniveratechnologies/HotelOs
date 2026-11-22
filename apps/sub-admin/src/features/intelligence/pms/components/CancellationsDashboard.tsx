import { TrendChart } from "../../shared/components/TrendChart";
import { DonutBreakdown } from "../../shared/components/DonutBreakdown";
import { BarList } from "../../shared/components/BarList";
import { ComparisonCard } from "../../shared/components/ComparisonCard";
import { money, num } from "../../shared/utils/formatters";
import type { DashboardData } from "../../shared/types";

interface ReasonItem {
  name: string;
  value: number;
  color: string;
}

interface CountItem {
  name: string;
  count: number;
  color?: string;
  cancellations?: number;
}

export function CancellationsDashboard({ data }: { data: DashboardData }) {
  const cancellationTrend =
    (data.cancellationTrend as Record<string, unknown>[]) || [];
  const reasons = (data.reasons as ReasonItem[]) || [];
  const cancellationSources = (data.cancellationSources as CountItem[]) || [];
  const roomTypes = (data.roomTypes as CountItem[]) || [];
  const cancellationLeadTime = (data.cancellationLeadTime as CountItem[]) || [];
  const comparison =
    (data.comparison as {
      name: string;
      value: string | number;
      change?: string;
    }[]) || [];
  const summary = (data.summary as { cancellations?: number }) || {};

  return (
    <>
      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Cancellation Trend</div>
          <div className="card-subtitle">
            Daily cancellation count and cancellation rate
          </div>
          <TrendChart
            data={cancellationTrend}
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
            data={reasons}
            centerLabel="Cancellations"
            centerValue={num(summary.cancellations)}
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
            rows={cancellationSources.map((s) => ({
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
            rows={roomTypes.map((r) => ({
              name: r.name,
              value: r.cancellations ?? 0,
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
            rows={cancellationLeadTime.map((l) => ({
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
            data={cancellationTrend}
            lines={[
              { key: "revenueLost", name: "Revenue Lost", color: "#d0483f" },
            ]}
            valueFormatter={(v) => money(Number(v))}
          />
        </div>
        <div className="card">
          <div className="card-title">Cancellation Comparison</div>
          <div className="card-subtitle">Compare with previous period</div>
          <ComparisonCard rows={comparison} />
        </div>
      </div>
    </>
  );
}

export default CancellationsDashboard;
