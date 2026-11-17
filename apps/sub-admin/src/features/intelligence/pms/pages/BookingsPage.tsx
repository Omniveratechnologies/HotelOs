import { useIntelligenceDashboard } from "../../shared/hooks/useIntelligenceDashboard";
import { IntelligenceDashboardLayout } from "../../shared/components/IntelligenceDashboardLayout";
import { BookingsDashboard } from "../components/BookingsDashboard";
import { DASHBOARDS } from "../data/pmsData";

export default function BookingsPage() {
  const meta = DASHBOARDS.bookings;
  const { data, loading, error, range, setRange } = useIntelligenceDashboard(
    "pms",
    "bookings",
  );

  return (
    <IntelligenceDashboardLayout
      meta={meta}
      module="pms"
      dashboardId="bookings"
      range={range}
      setRange={setRange}
      data={data}
      loading={loading}
      error={error}
    >
      {data && <BookingsDashboard data={data} />}
    </IntelligenceDashboardLayout>
  );
}
