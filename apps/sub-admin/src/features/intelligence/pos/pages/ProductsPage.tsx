import { useIntelligenceDashboard } from "../../shared/hooks/useIntelligenceDashboard";
import { IntelligenceDashboardLayout } from "../../shared/components/IntelligenceDashboardLayout";
import ProductsDashboard from "../components/ProductsDashboard";
import { POS_DASHBOARDS } from "../data/posData";

export default function ProductsPage() {
  const meta = POS_DASHBOARDS.products;
  const { data, loading, error, range, setRange } = useIntelligenceDashboard(
    "pos",
    "products",
  );

  return (
    <IntelligenceDashboardLayout
      meta={meta}
      module="pos"
      dashboardId="products"
      range={range}
      setRange={setRange}
      data={data}
      loading={loading}
      error={error}
    >
      {data && <ProductsDashboard data={data} />}
    </IntelligenceDashboardLayout>
  );
}
