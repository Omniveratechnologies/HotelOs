import { useIntelligenceDashboard } from "../../shared/hooks/useIntelligenceDashboard";
import { IntelligenceDashboardLayout } from "../../shared/components/IntelligenceDashboardLayout";
import { CancellationsDashboard } from "../components/CancellationsDashboard";
import { DASHBOARDS } from "../data/pmsData";

export default function CancellationsPage() {
  const meta = DASHBOARDS.cancellations;
  const { data, loading, error, range, setRange } = useIntelligenceDashboard(
    "pms",
    "cancellations",
  );

  return (
    <IntelligenceDashboardLayout
      meta={meta}
      module="pms"
      dashboardId="cancellations"
      range={range}
      setRange={setRange}
      data={data}
      loading={loading}
      error={error}
    >
      {data && <CancellationsDashboard data={data} />}
    </IntelligenceDashboardLayout>
  );
}
