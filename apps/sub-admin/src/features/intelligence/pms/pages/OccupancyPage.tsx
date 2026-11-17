import { useIntelligenceDashboard } from "../../shared/hooks/useIntelligenceDashboard";
import { IntelligenceDashboardLayout } from "../../shared/components/IntelligenceDashboardLayout";
import { OccupancyDashboard } from "../components/OccupancyDashboard";
import { DASHBOARDS } from "../data/pmsData";

export default function OccupancyPage() {
  const meta = DASHBOARDS.occupancy;
  const { data, loading, error, range, setRange } = useIntelligenceDashboard(
    "pms",
    "occupancy",
  );

  return (
    <IntelligenceDashboardLayout
      meta={meta}
      module="pms"
      dashboardId="occupancy"
      range={range}
      setRange={setRange}
      data={data}
      loading={loading}
      error={error}
    >
      {data && <OccupancyDashboard data={data} />}
    </IntelligenceDashboardLayout>
  );
}
