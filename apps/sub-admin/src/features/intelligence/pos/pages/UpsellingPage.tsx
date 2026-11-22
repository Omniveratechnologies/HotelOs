import { useIntelligenceDashboard } from "../../shared/hooks/useIntelligenceDashboard";
import { IntelligenceDashboardLayout } from "../../shared/components/IntelligenceDashboardLayout";
import UpsellingDashboard from "../components/UpsellingDashboard";
import { POS_DASHBOARDS } from "../data/posData";

export default function UpsellingPage() {
  const meta = POS_DASHBOARDS.upselling;
  const { data, loading, error, range, setRange } = useIntelligenceDashboard(
    "pos",
    "upselling",
  );

  return (
    <IntelligenceDashboardLayout
      meta={meta}
      module="pos"
      dashboardId="upselling"
      range={range}
      setRange={setRange}
      data={data}
      loading={loading}
      error={error}
    >
      {data && <UpsellingDashboard data={data} />}
    </IntelligenceDashboardLayout>
  );
}
