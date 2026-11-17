import { useIntelligenceDashboard } from "../../shared/hooks/useIntelligenceDashboard";
import { IntelligenceDashboardLayout } from "../../shared/components/IntelligenceDashboardLayout";
import ClvDashboard from "../components/ClvDashboard";
import { BI_DASHBOARDS } from "../data/biData";

export default function ClvPage() {
  const meta = BI_DASHBOARDS.clv;
  const { data, loading, error, range, setRange } = useIntelligenceDashboard(
    "bi",
    "clv",
  );

  return (
    <IntelligenceDashboardLayout
      meta={meta}
      module="bi"
      dashboardId="clv"
      range={range}
      setRange={setRange}
      data={data}
      loading={loading}
      error={error}
    >
      {data && <ClvDashboard data={data} />}
    </IntelligenceDashboardLayout>
  );
}
