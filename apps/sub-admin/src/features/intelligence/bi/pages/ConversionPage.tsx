import { useIntelligenceDashboard } from "../../shared/hooks/useIntelligenceDashboard";
import { IntelligenceDashboardLayout } from "../../shared/components/IntelligenceDashboardLayout";
import ConversionDashboard from "../components/ConversionDashboard";
import { BI_DASHBOARDS } from "../data/biData";

export default function ConversionPage() {
  const meta = BI_DASHBOARDS.conversion;
  const { data, loading, error, range, setRange } = useIntelligenceDashboard(
    "bi",
    "conversion",
  );

  return (
    <IntelligenceDashboardLayout
      meta={meta}
      module="bi"
      dashboardId="conversion"
      range={range}
      setRange={setRange}
      data={data}
      loading={loading}
      error={error}
    >
      {data && <ConversionDashboard data={data} />}
    </IntelligenceDashboardLayout>
  );
}
