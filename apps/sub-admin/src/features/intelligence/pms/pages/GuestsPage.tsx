import { useIntelligenceDashboard } from "../../shared/hooks/useIntelligenceDashboard";
import { IntelligenceDashboardLayout } from "../../shared/components/IntelligenceDashboardLayout";
import { GuestsDashboard } from "../components/GuestsDashboard";
import { DASHBOARDS } from "../data/pmsData";

export default function GuestsPage() {
  const meta = DASHBOARDS.guests;
  const { data, loading, error, range, setRange } = useIntelligenceDashboard(
    "pms",
    "guests",
  );

  return (
    <IntelligenceDashboardLayout
      meta={meta}
      module="pms"
      dashboardId="guests"
      range={range}
      setRange={setRange}
      data={data}
      loading={loading}
      error={error}
    >
      {data && <GuestsDashboard data={data} />}
    </IntelligenceDashboardLayout>
  );
}
