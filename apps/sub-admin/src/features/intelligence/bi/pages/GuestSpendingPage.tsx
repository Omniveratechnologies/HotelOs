import { useIntelligenceDashboard } from "../../shared/hooks/useIntelligenceDashboard";
import { IntelligenceDashboardLayout } from "../../shared/components/IntelligenceDashboardLayout";
import GuestSpendingDashboard from "../components/GuestSpendingDashboard";
import { BI_DASHBOARDS } from "../data/biData";

export default function GuestSpendingPage() {
  const meta = BI_DASHBOARDS["guest-spending"];
  const { data, loading, error, range, setRange } = useIntelligenceDashboard(
    "bi",
    "guest-spending",
  );

  return (
    <IntelligenceDashboardLayout
      meta={meta}
      module="bi"
      dashboardId="guest-spending"
      range={range}
      setRange={setRange}
      data={data}
      loading={loading}
      error={error}
    >
      {data && <GuestSpendingDashboard data={data} />}
    </IntelligenceDashboardLayout>
  );
}
