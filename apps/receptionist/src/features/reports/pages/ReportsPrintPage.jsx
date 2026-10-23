import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { useReports } from "../hooks/useReports.js";
import { format } from "date-fns";
import {
  KPICard,
  GuestActivityCard,
  MetricSummaryCard,
} from "../components/SummaryCards.jsx";
import {
  OccupancyTrendChart,
  RevenueTrendChart,
  RevenueByTypePie,
  ServiceRequestStatusChart,
  RoomStatusDonut,
} from "../components/Charts.jsx";
import {
  RoomTypeTable,
  BookingSourcesTable,
  RecentBookingsTable,
  TopFoodItemsTable,
  ServiceRequestTypesTable,
} from "../components/DataTable.jsx";

const formatCurrency = (val) => `₹${(val || 0).toLocaleString("en-IN")}`;

const PrintTrigger = () => {
  useEffect(() => {
    let printTimer;
    let hasPrinted = false;

    const handleAfterPrint = () => {
      hasPrinted = true;
      // Close the window after print dialog closes (success or cancel)
      setTimeout(() => {
        window.close();
      }, 100);
    };

    const handleBeforePrint = () => {
      // Print dialog opened
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    printTimer = setTimeout(() => {
      window.print();
    }, 500);

    return () => {
      clearTimeout(printTimer);
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
      // Fallback: if afterprint doesn't fire (e.g., print canceled in some browsers)
      if (!hasPrinted) {
        setTimeout(() => window.close(), 2000);
      }
    };
  }, []);
  return null;
};

export default function ReportsPrintPage() {
  const [searchParams] = useSearchParams();

  const period = searchParams.get("period") || "today";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  const { ...reportData } = useReports({ period, startDate, endDate });

  const {
    isLoading,
    error,
    hotelName,
    reportDate,
    period: currentPeriod,
    periodStart,
    periodEnd,
    // Room metrics
    total,
    occupied,
    available,
    reserved,
    cleaning,
    occupancyRate,
    roomsByType,
    // Booking metrics
    checkedIn,
    arrivalsToday,
    departuresToday,
    totalBookings,
    avgStayDuration,
    bookingSources,
    recentBookings,
    checkedInGuests,
    reservedGuests,
    checkedOutGuests,
    // Revenue metrics
    roomRevenue,
    foodRevenue,
    totalRevenue,
    avgDailyRate,
    revPAR,
    foodOrderCount,
    avgOrderValue,
    revenueByType,
    dailyRevenue,
    dailyRoomRevenue,
    topFoodItems,
    // Service request metrics
    totalRequests,
    serviceRequestsByStatus,
    serviceRequestsByType,
    avgResponseTimeMinutes,
    // Trends
    occupancyTrend,
  } = reportData;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center p-6">
        <div className="border-brand-900 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        Failed to load report data: {error.message}
      </div>
    );
  }

  return (
    <div className="print-page">
      <PrintTrigger />

      {/* Print Header */}
      <div className="print-header no-print">
        <h1 className="text-brand-900 mb-2 text-3xl font-bold">{hotelName}</h1>
        <p className="text-gray-600">Operational Report</p>
        <p className="mt-1 text-sm text-gray-500">{reportDate}</p>
        <p className="mt-1 text-xs text-gray-400">
          Period:{" "}
          {currentPeriod === "custom" && periodStart && periodEnd
            ? `${periodStart} to ${periodEnd}`
            : currentPeriod.charAt(0).toUpperCase() + currentPeriod.slice(1)}
        </p>
      </div>

      <div className="print-content space-y-8">
        {/* KPI Cards */}
        <section className="kpi-section print-section">
          <h2 className="text-brand-900 mb-4 text-xl font-bold">
            Key Performance Indicators
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <KPICard
              label="Occupancy Rate"
              value={`${occupancyRate}%`}
              sub={`${occupied}/${total} rooms`}
              color="text-blue-600"
              bg="bg-blue-50"
              cardBg="bg-background-50"
              icon="🏨"
            />
            <KPICard
              label="Room Revenue"
              value={formatCurrency(roomRevenue)}
              sub={`${occupied} occupied rooms`}
              color="text-green-600"
              bg="bg-green-50"
              cardBg="bg-background-50"
              icon="💰"
            />
            <KPICard
              label="F&B Revenue"
              value={formatCurrency(foodRevenue)}
              sub={`${foodOrderCount} delivered orders`}
              color="text-blue-600"
              bg="bg-blue-50"
              cardBg="bg-background-100"
              icon="🍽️"
            />
            <KPICard
              label="Total Revenue"
              value={formatCurrency(totalRevenue)}
              sub={`RevPAR: ${formatCurrency(revPAR)}`}
              color="text-purple-600"
              bg="bg-purple-50"
              cardBg="bg-background-100"
              icon="📈"
            />
            <KPICard
              label="Avg Daily Rate"
              value={formatCurrency(avgDailyRate)}
              sub="Per occupied room"
              color="text-amber-600"
              bg="bg-amber-50"
              cardBg="bg-background-50"
              icon="📊"
            />
          </div>
        </section>

        {/* Charts Row 1 */}
        <section className="charts-section print-section grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="chart-card bg-background-50 rounded-2xl border border-gray-100 p-5 shadow-xs">
            <h3 className="text-brand-900 mb-4 text-lg font-bold">
              Occupancy Trend
            </h3>
            <OccupancyTrendChart data={occupancyTrend} animationDuration={0} />
          </div>
          <div className="chart-card bg-background-100 rounded-2xl border border-gray-100 p-5 shadow-xs">
            <h3 className="text-brand-900 mb-4 text-lg font-bold">
              Revenue Trend
            </h3>
            <RevenueTrendChart
              dailyRevenue={dailyRevenue}
              dailyRoomRevenue={dailyRoomRevenue}
              animationDuration={0}
            />
          </div>
        </section>

        {/* Charts Row 2 */}
        <section className="charts-section print-section grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="chart-card bg-background-50 rounded-2xl border border-gray-100 p-5 shadow-xs">
            <h3 className="text-brand-900 mb-4 text-lg font-bold">
              Current Room Status
            </h3>
            <RoomStatusDonut
              available={available}
              occupied={occupied}
              reserved={reserved}
              cleaning={cleaning}
              total={total}
              occupancyRate={occupancyRate}
            />
          </div>
          <div className="chart-card bg-background-100 rounded-2xl border border-gray-100 p-5 shadow-xs">
            <h3 className="text-brand-900 mb-4 text-lg font-bold">
              Revenue by Room Type
            </h3>
            <RevenueByTypePie
              revenueByType={revenueByType}
              animationDuration={0}
            />
          </div>
        </section>

        {/* Room Type Performance Table */}
        <section className="table-section print-section bg-background-50 rounded-2xl border border-gray-100 p-5 shadow-xs">
          <h3 className="text-brand-900 mb-4 text-lg font-bold">
            Room Type Performance
          </h3>
          <RoomTypeTable roomsByType={roomsByType} />
        </section>

        {/* Guest Activity */}
        <section className="guest-section print-section grid grid-cols-1 gap-4 md:grid-cols-3">
          <GuestActivityCard
            label="Checked In"
            value={checkedIn}
            color="text-blue-600"
            cardBg="bg-background-50"
            guests={checkedInGuests}
            emptyText="No guests in-house"
          />
          <GuestActivityCard
            label="Upcoming Arrivals"
            value={arrivalsToday}
            color="text-amber-600"
            cardBg="bg-background-100"
            guests={reservedGuests}
            emptyText="No upcoming reservations"
          />
          <GuestActivityCard
            label="Departures Today"
            value={departuresToday}
            color="text-gray-500"
            cardBg="bg-background-50"
            guests={checkedOutGuests}
            emptyText="No departures"
          />
        </section>

        {/* Booking Sources & Recent Bookings */}
        <section className="tables-section print-section grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="table-section bg-background-50 rounded-2xl border border-gray-100 p-5 shadow-xs">
            <h3 className="text-brand-900 mb-4 text-lg font-bold">
              Booking Sources
            </h3>
            <BookingSourcesTable bookingSources={bookingSources} />
          </div>
          <div className="table-section bg-background-100 rounded-2xl border border-gray-100 p-5 shadow-xs">
            <h3 className="text-brand-900 mb-4 text-lg font-bold">
              Recent Bookings
            </h3>
            <RecentBookingsTable recentBookings={recentBookings} />
          </div>
        </section>

        {/* F&B Top Items */}
        <section className="table-section print-section bg-background-50 rounded-2xl border border-gray-100 p-5 shadow-xs">
          <h3 className="text-brand-900 mb-4 text-lg font-bold">
            Top F&B Items
          </h3>
          <TopFoodItemsTable topFoodItems={topFoodItems} />
        </section>

        {/* Service Requests */}
        <section className="charts-section print-section grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="chart-card bg-background-50 rounded-2xl border border-gray-100 p-5 shadow-xs">
            <h3 className="text-brand-900 mb-4 text-lg font-bold">
              Service Request Status
            </h3>
            <ServiceRequestStatusChart
              serviceRequestsByStatus={serviceRequestsByStatus}
              animationDuration={0}
            />
          </div>
          <div className="table-section bg-background-100 rounded-2xl border border-gray-100 p-5 shadow-xs">
            <h3 className="text-brand-900 mb-4 text-lg font-bold">
              Service Request Types
            </h3>
            <ServiceRequestTypesTable
              serviceRequestsByType={serviceRequestsByType}
            />
          </div>
        </section>

        {/* Key Metrics Summary */}
        <section className="metrics-summary print-section bg-brand-900 rounded-2xl p-5">
          <h3 className="mb-4 font-bold text-white">Key Metrics Summary</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
            <MetricSummaryCard
              label="Total Bookings"
              value={totalBookings}
              color="text-white"
            />
            <MetricSummaryCard
              label="Avg Stay (days)"
              value={avgStayDuration}
              color="text-white"
            />
            <MetricSummaryCard
              label="Total Requests"
              value={totalRequests}
              color="text-white"
            />
            <MetricSummaryCard
              label="Avg Response (min)"
              value={avgResponseTimeMinutes}
              color="text-white"
            />
            <MetricSummaryCard
              label="F&B Orders"
              value={foodOrderCount}
              color="text-white"
            />
            <MetricSummaryCard
              label="Avg Order Value"
              value={formatCurrency(avgOrderValue)}
              color="text-white"
            />
            <MetricSummaryCard
              label="Booking Sources"
              value={bookingSources.length}
              color="text-white"
            />
          </div>
        </section>
      </div>

      {/* Print Footer */}
      <div className="print-footer">
        <p>
          Generated on {format(new Date(), "MMMM d, yyyy")} • HotelOS Reporting
          System
        </p>
        <p className="mt-1 text-xs text-gray-400">
          This report was generated from the HotelOS Receptionist Dashboard
        </p>
      </div>
    </div>
  );
}
