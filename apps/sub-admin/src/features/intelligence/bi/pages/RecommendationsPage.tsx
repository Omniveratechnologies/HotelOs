import { useIntelligenceDashboard } from "../../shared/hooks/useIntelligenceDashboard";
import { IntelligenceDashboardLayout } from "../../shared/components/IntelligenceDashboardLayout";
import RecommendationsDashboard from "../components/RecommendationsDashboard";
import { BI_DASHBOARDS } from "../data/biData";

export default function RecommendationsPage() {
  const meta = BI_DASHBOARDS.recommendations;
  const { data, loading, error, range, setRange, handleRecommendationAction } =
    useIntelligenceDashboard("bi", "recommendations");

  return (
    <IntelligenceDashboardLayout
      meta={meta}
      module="bi"
      dashboardId="recommendations"
      range={range}
      setRange={setRange}
      data={data}
      loading={loading}
      error={error}
    >
      {data && (
        <RecommendationsDashboard
          data={data}
          onAction={handleRecommendationAction}
        />
      )}
    </IntelligenceDashboardLayout>
  );
}
