import { useIntelligenceDashboard } from "../../shared/hooks/useIntelligenceDashboard";
import { IntelligenceDashboardLayout } from "../../shared/components/IntelligenceDashboardLayout";
import { RevenueDashboard } from "../components/RevenueDashboard";
import { DASHBOARDS } from "../data/pmsData";

export default function RevenuePage() {
  const meta = DASHBOARDS.revenue;
  const { data, loading, error, range, setRange } = useIntelligenceDashboard(
    "pms",
    "revenue",
  );

  return (
    <IntelligenceDashboardLayout
      meta={meta}
      module="pms"
      dashboardId="revenue"
      range={range}
      setRange={setRange}
      data={data}
      loading={loading}
      error={error}
    >
      {data && <RevenueDashboard data={data} />}
    </IntelligenceDashboardLayout>
  );
}
