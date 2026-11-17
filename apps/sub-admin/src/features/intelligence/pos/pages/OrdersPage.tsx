import { useIntelligenceDashboard } from "../../shared/hooks/useIntelligenceDashboard";
import { IntelligenceDashboardLayout } from "../../shared/components/IntelligenceDashboardLayout";
import OrdersDashboard from "../components/OrdersDashboard";
import { POS_DASHBOARDS } from "../data/posData";

export default function OrdersPage() {
  const meta = POS_DASHBOARDS.orders;
  const { data, loading, error, range, setRange } = useIntelligenceDashboard(
    "pos",
    "orders",
  );

  return (
    <IntelligenceDashboardLayout
      meta={meta}
      module="pos"
      dashboardId="orders"
      range={range}
      setRange={setRange}
      data={data}
      loading={loading}
      error={error}
    >
      {data && <OrdersDashboard data={data} />}
    </IntelligenceDashboardLayout>
  );
}
