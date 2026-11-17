import { useIntelligenceDashboard } from "../../shared/hooks/useIntelligenceDashboard";
import { IntelligenceDashboardLayout } from "../../shared/components/IntelligenceDashboardLayout";
import StaffDashboard from "../components/StaffDashboard";
import { POS_DASHBOARDS } from "../data/posData";

export default function StaffPage() {
  const meta = POS_DASHBOARDS.staff;
  const { data, loading, error, range, setRange } = useIntelligenceDashboard(
    "pos",
    "staff",
  );

  return (
    <IntelligenceDashboardLayout
      meta={meta}
      module="pos"
      dashboardId="staff"
      range={range}
      setRange={setRange}
      data={data}
      loading={loading}
      error={error}
    >
      {data && <StaffDashboard data={data} />}
    </IntelligenceDashboardLayout>
  );
}
