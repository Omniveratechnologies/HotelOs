import { useIntelligenceDashboard } from "../../shared/hooks/useIntelligenceDashboard";
import { IntelligenceDashboardLayout } from "../../shared/components/IntelligenceDashboardLayout";
import ProfitabilityDashboard from "../components/ProfitabilityDashboard";
import { BI_DASHBOARDS } from "../data/biData";

export default function ProfitabilityPage() {
  const meta = BI_DASHBOARDS.profitability;
  const { data, loading, error, range, setRange } = useIntelligenceDashboard(
    "bi",
    "profitability",
  );

  return (
    <IntelligenceDashboardLayout
      meta={meta}
      module="bi"
      dashboardId="profitability"
      range={range}
      setRange={setRange}
      data={data}
      loading={loading}
      error={error}
    >
      {data && <ProfitabilityDashboard data={data} />}
    </IntelligenceDashboardLayout>
  );
}
