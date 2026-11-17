import { TrendChart } from "../../shared/components/TrendChart";
import {
  DonutBreakdown,
  type DonutItem,
} from "../../shared/components/DonutBreakdown";
import { BarList } from "../../shared/components/BarList";
import { num, pctStr } from "../../shared/utils/formatters";
import type { DashboardData } from "../../shared/types";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

interface CountItem {
  name: string;
  count: number;
  color?: string;
}

export function GuestsDashboard({ data }: { data: DashboardData }) {
  const series = (data.series as Record<string, unknown>[]) || [];
  const guestMix = (data.guestMix as DonutItem[]) || [];
  const summary = (data.summary as { guests?: number }) || {};
  const nationality = (data.nationality as CountItem[]) || [];
  const cities = (data.cities as CountItem[]) || [];
  const ageGroups = (data.ageGroups as CountItem[]) || [];
  const purpose = (data.purpose as CountItem[]) || [];
  const stayDuration = (data.stayDuration as CountItem[]) || [];
  const repeatAnalysis =
    (data.repeatAnalysis as {
      returningRate?: number;
      averageBookings?: number;
      averageSpend?: string;
    }) || {};

  return (
    <>
      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Guest Trend</div>
          <div className="card-subtitle">Guest arrivals over time</div>
          <TrendChart
            data={series}
            lines={[{ key: "guests", name: "Guests", color: "#157a70" }]}
            valueFormatter={(v) => num(Number(v))}
          />
        </div>
        <div className="card">
          <div className="card-title">Guest Type Distribution</div>
          <div className="card-subtitle">Share of new vs returning guests</div>
          <DonutBreakdown
            data={guestMix}
            centerLabel="Total Guests"
            centerValue={num(summary.guests)}
            valueIsMoney={false}
          />
        </div>
      </div>

      <div className="two-col grid" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Guest Nationality</div>
          <div className="card-subtitle">Top 5 nationalities</div>
          <BarList
            rows={nationality.map((n) => ({
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
            rows={cities.map((c) => ({
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
            rows={ageGroups.map((a) => ({ name: a.name, value: a.count }))}
            formatValue={(r) => num(r.value)}
          />
        </div>
        <div className="card">
          <div className="card-title">Purpose of Visit</div>
          <div className="card-subtitle">
            Why guests are staying at your hotel
          </div>
          <BarList
            rows={purpose.map((p) => ({
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
              value={pctStr(repeatAnalysis.returningRate)}
            />
            <Stat
              label="Avg bookings / returning guest"
              value={repeatAnalysis.averageBookings?.toFixed(1) ?? "0"}
            />
            <Stat
              label="Avg spend by returning guest"
              value={repeatAnalysis.averageSpend ?? "—"}
            />
          </div>
        </div>
        <div className="card">
          <div className="card-title">Guest Stay Duration</div>
          <div className="card-subtitle">Distribution of length of stay</div>
          <BarList
            rows={stayDuration.map((s) => ({
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

export default GuestsDashboard;
