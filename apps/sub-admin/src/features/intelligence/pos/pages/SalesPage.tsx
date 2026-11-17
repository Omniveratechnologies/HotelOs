import { useIntelligenceDashboard } from "../../shared/hooks/useIntelligenceDashboard";
import { IntelligenceDashboardLayout } from "../../shared/components/IntelligenceDashboardLayout";
import SalesDashboard from "../components/SalesDashboard";
import { POS_DASHBOARDS } from "../data/posData";

export default function SalesPage() {
  const meta = POS_DASHBOARDS.sales;
  const { data, loading, error, range, setRange } = useIntelligenceDashboard(
    "pos",
    "sales",
  );

  return (
    <IntelligenceDashboardLayout
      meta={meta}
      module="pos"
      dashboardId="sales"
      range={range}
      setRange={setRange}
      data={data}
      loading={loading}
      error={error}
    >
      {data && <SalesDashboard data={data} />}
    </IntelligenceDashboardLayout>
  );
}
