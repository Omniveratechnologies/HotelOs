import { useIntelligenceDashboard } from "../../shared/hooks/useIntelligenceDashboard";
import { IntelligenceDashboardLayout } from "../../shared/components/IntelligenceDashboardLayout";
import TotalRevenueDashboard from "../components/TotalRevenueDashboard";
import { BI_DASHBOARDS } from "../data/biData";

export default function TotalRevenuePage() {
  const meta = BI_DASHBOARDS["total-revenue"];
  const { data, loading, error, range, setRange } = useIntelligenceDashboard(
    "bi",
    "total-revenue",
  );

  return (
    <IntelligenceDashboardLayout
      meta={meta}
      module="bi"
      dashboardId="total-revenue"
      range={range}
      setRange={setRange}
      data={data}
      loading={loading}
      error={error}
    >
      {data && <TotalRevenueDashboard data={data} />}
    </IntelligenceDashboardLayout>
  );
}
