import { useIntelligenceDashboard } from "../../shared/hooks/useIntelligenceDashboard";
import { IntelligenceDashboardLayout } from "../../shared/components/IntelligenceDashboardLayout";
import { ForecastDashboard } from "../components/ForecastDashboard";
import { DASHBOARDS } from "../data/pmsData";

export default function ForecastPage() {
  const meta = DASHBOARDS.forecast;
  const { data, loading, error, range, setRange } = useIntelligenceDashboard(
    "pms",
    "forecast",
  );

  return (
    <IntelligenceDashboardLayout
      meta={meta}
      module="pms"
      dashboardId="forecast"
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
