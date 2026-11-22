import { useIntelligenceDashboard } from "../../shared/hooks/useIntelligenceDashboard";
import { IntelligenceDashboardLayout } from "../../shared/components/IntelligenceDashboardLayout";
import { RevparDashboard } from "../components/RevparDashboard";
import { DASHBOARDS } from "../data/pmsData";

export default function RevparPage() {
  const meta = DASHBOARDS.revpar;
  const { data, loading, error, range, setRange } = useIntelligenceDashboard(
    "pms",
    "revpar",
  );

  return (
    <IntelligenceDashboardLayout
      meta={meta}
      module="pms"
      dashboardId="revpar"
      range={range}
      setRange={setRange}
      data={data}
      loading={loading}
      error={error}
    >
      {data && <RevparDashboard data={data} />}
    </IntelligenceDashboardLayout>
  );
}
