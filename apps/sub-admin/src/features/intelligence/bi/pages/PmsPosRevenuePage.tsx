import { useIntelligenceDashboard } from "../../shared/hooks/useIntelligenceDashboard";
import { IntelligenceDashboardLayout } from "../../shared/components/IntelligenceDashboardLayout";
import PmsPosRevenueDashboard from "../components/PmsPosRevenueDashboard";
import { BI_DASHBOARDS } from "../data/biData";

export default function PmsPosRevenuePage() {
  const meta = BI_DASHBOARDS["pms-pos-revenue"];
  const { data, loading, error, range, setRange } = useIntelligenceDashboard(
    "bi",
    "pms-pos-revenue",
  );

  return (
    <IntelligenceDashboardLayout
      meta={meta}
      module="bi"
      dashboardId="pms-pos-revenue"
      range={range}
      setRange={setRange}
      data={data}
      loading={loading}
      error={error}
    >
      {data && <PmsPosRevenueDashboard data={data} />}
    </IntelligenceDashboardLayout>
  );
}
