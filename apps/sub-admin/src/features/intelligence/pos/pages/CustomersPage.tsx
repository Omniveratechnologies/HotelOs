import { useIntelligenceDashboard } from "../../shared/hooks/useIntelligenceDashboard";
import { IntelligenceDashboardLayout } from "../../shared/components/IntelligenceDashboardLayout";
import CustomersDashboard from "../components/CustomersDashboard";
import { POS_DASHBOARDS } from "../data/posData";

export default function CustomersPage() {
  const meta = POS_DASHBOARDS.customers;
  const { data, loading, error, range, setRange } = useIntelligenceDashboard(
    "pos",
    "customers",
  );

  return (
    <IntelligenceDashboardLayout
      meta={meta}
      module="pos"
      dashboardId="customers"
      range={range}
      setRange={setRange}
      data={data}
      loading={loading}
      error={error}
    >
      {data && <CustomersDashboard data={data} />}
    </IntelligenceDashboardLayout>
  );
}
