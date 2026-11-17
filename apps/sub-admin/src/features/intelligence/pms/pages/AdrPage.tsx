import { useIntelligenceDashboard } from "../../shared/hooks/useIntelligenceDashboard";
import { IntelligenceDashboardLayout } from "../../shared/components/IntelligenceDashboardLayout";
import { AdrDashboard } from "../components/AdrDashboard";
import { DASHBOARDS } from "../data/pmsData";

export default function AdrPage() {
  const meta = DASHBOARDS.adr;
  const { data, loading, error, range, setRange } = useIntelligenceDashboard(
    "pms",
    "adr",
  );

  return (
    <IntelligenceDashboardLayout
      meta={meta}
      module="pms"
      dashboardId="adr"
      range={range}
      setRange={setRange}
      data={data}
      loading={loading}
      error={error}
    >
      {data && <AdrDashboard data={data} />}
    </IntelligenceDashboardLayout>
  );
}
