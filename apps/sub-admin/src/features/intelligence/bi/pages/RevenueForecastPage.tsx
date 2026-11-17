import { useIntelligenceDashboard } from "../../shared/hooks/useIntelligenceDashboard";
import { IntelligenceDashboardLayout } from "../../shared/components/IntelligenceDashboardLayout";
import ForecastDashboard from "../components/ForecastDashboard";
import { BI_DASHBOARDS } from "../data/biData";

export default function RevenueForecastPage() {
  const meta = BI_DASHBOARDS["revenue-forecast"];
  const { data, loading, error, range, setRange } = useIntelligenceDashboard(
    "bi",
    "revenue-forecast",
  );

  return (
    <IntelligenceDashboardLayout
      meta={meta}
      module="bi"
      dashboardId="revenue-forecast"
      range={range}
      setRange={setRange}
      data={data}
      loading={loading}
      error={error}
    >
      {data && <ForecastDashboard data={data} />}
    </IntelligenceDashboardLayout>
  );
}
