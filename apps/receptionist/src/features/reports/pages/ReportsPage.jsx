import { useState } from "react";
import { Header } from "@hotelos/ui/components/Header";
import { Link } from "react-router";
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

const PeriodSelector = ({ currentPeriod, onPeriodChange }) => {
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showCustomDates, setShowCustomDates] = useState(false);

  const handlePeriodChange = (e) => {
    const period = e.target.value;
    if (period === "custom") {
      setShowCustomDates(true);
    } else {
      onPeriodChange(period);
      setShowCustomDates(false);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customStart && customEnd) {
      onPeriodChange("custom", customStart, customEnd);
      setShowCustomDates(false);
    }
  };

  const periodOptions = [
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "custom", label: "Custom Range" },
  ];

  return (
    <div className="flex w-full flex-col items-start gap-3 sm:w-auto sm:flex-row sm:items-center">
      <select
        value={currentPeriod.period}
        onChange={handlePeriodChange}
        className="focus:ring-brand-900 w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium focus:border-transparent focus:ring-2 focus:outline-none sm:w-48"
      >
        {periodOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {showCustomDates && (
        <form
          onSubmit={handleCustomSubmit}
          className="flex w-full flex-col items-start gap-2 sm:w-auto sm:flex-row sm:items-center"
        >
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <label
              htmlFor="customStart"
              className="text-sm whitespace-nowrap text-gray-600"
            >
              From
            </label>
            <input
              id="customStart"
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              max={format(new Date(), "yyyy-MM-dd")}
              className="focus:ring-brand-900 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:outline-none"
              required
            />
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <label
              htmlFor="customEnd"
              className="text-sm whitespace-nowrap text-gray-600"
            >
              To
            </label>
            <input
              id="customEnd"
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              max={format(new Date(), "yyyy-MM-dd")}
              className="focus:ring-brand-900 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:outline-none"
              required
            />
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <button
              type="submit"
              className="bg-brand-900 hover:bg-brand-800 focus:ring-brand-900 flex-1 rounded-xl px-4 py-2 text-sm font-medium text-white focus:ring-2 focus:ring-offset-2 focus:outline-none sm:flex-none"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => setShowCustomDates(false)}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:outline-none sm:flex-none"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

const PrintButton = ({ currentPeriod, periodStart, periodEnd }) => {
  const buildPrintUrl = () => {
    const params = new URLSearchParams();
    if (currentPeriod) params.set("period", currentPeriod);
    if (periodStart) params.set("startDate", periodStart);
    if (periodEnd) params.set("endDate", periodEnd);
    return `/reports/print?${params.toString()}`;
  };

  return (
    <Link
      to={buildPrintUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
        />
      </svg>
      Print / Save as PDF
    </Link>
  );
};

export default function ReportsPage() {
  const [period, setPeriod] = useState("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const reportData = useReports({
    period,
    startDate: customStart,
    endDate: customEnd,
  });

  const handlePeriodChange = (newPeriod, startDate, endDate) => {
    setPeriod(newPeriod);
    if (newPeriod === "custom") {
      setCustomStart(startDate);
      setCustomEnd(endDate);
    }
  };

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
      <>
        <Header
          pageTitle="Reports & Analytics"
          pageDescription="Loading report data..."
        />
        <div className="flex h-64 items-center justify-center p-6">
          <div className="border-brand-900 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header
          pageTitle="Reports & Analytics"
          pageDescription="Error loading report"
        />
        <div className="p-6 text-center text-red-600">
          Failed to load report data: {error.message}
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        pageTitle="Reports & Analytics"
        pageDescription={`${hotelName} • ${reportDate}`}
      >
        <div className="flex items-center gap-3">
          <PeriodSelector
            currentPeriod={currentPeriod}
            onPeriodChange={handlePeriodChange}
          />
          <PrintButton
            currentPeriod={currentPeriod}
            periodStart={periodStart}
            periodEnd={periodEnd}
          />
        </div>
      </Header>

      <div className="space-y-6 p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <KPICard
            label="Occupancy Rate"
            value={`${occupancyRate}%`}
            sub={`${occupied}/${total} rooms`}
            color="text-blue-600"
            bg="bg-blue-50"
            icon="🏨"
          />
          <KPICard
            label="Room Revenue"
            value={formatCurrency(roomRevenue)}
            sub={`${occupied} occupied rooms`}
            color="text-green-600"
            bg="bg-green-50"
            icon="💰"
          />
          <KPICard
            label="F&B Revenue"
            value={formatCurrency(foodRevenue)}
            sub={`${foodOrderCount} delivered orders`}
            color="text-blue-600"
            bg="bg-blue-50"
            icon="🍽️"
          />
          <KPICard
            label="Total Revenue"
            value={formatCurrency(totalRevenue)}
            sub={`RevPAR: ${formatCurrency(revPAR)}`}
            color="text-purple-600"
            bg="bg-purple-50"
            icon="📈"
          />
          <KPICard
            label="Avg Daily Rate"
            value={formatCurrency(avgDailyRate)}
            sub="Per occupied room"
            color="text-amber-600"
            bg="bg-amber-50"
            icon="📊"
          />
        </div>

        {/* Charts Row 1: Occupancy Trend + Revenue Trend */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
            <h3 className="text-brand-900 mb-4 font-bold">Occupancy Trend</h3>
            <OccupancyTrendChart data={occupancyTrend} />
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
            <h3 className="text-brand-900 mb-4 font-bold">Revenue Trend</h3>
            <RevenueTrendChart
              dailyRevenue={dailyRevenue}
              dailyRoomRevenue={dailyRoomRevenue}
            />
          </div>
        </div>

        {/* Charts Row 2: Room Status + Revenue by Type Pie */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
            <h3 className="text-brand-900 mb-4 font-bold">
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
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
            <h3 className="text-brand-900 mb-4 font-bold">
              Revenue by Room Type
            </h3>
            <RevenueByTypePie revenueByType={revenueByType} />
          </div>
        </div>

        {/* Room Type Performance Table */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          <h3 className="text-brand-900 mb-4 font-bold">
            Room Type Performance
          </h3>
          <RoomTypeTable roomsByType={roomsByType} />
        </div>

        {/* Guest Activity */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <GuestActivityCard
            label="Checked In"
            value={checkedIn}
            color="text-blue-600"
            guests={checkedInGuests}
            emptyText="No guests in-house"
          />
          <GuestActivityCard
            label="Upcoming Arrivals"
            value={arrivalsToday}
            color="text-amber-600"
            guests={reservedGuests}
            emptyText="No upcoming reservations"
          />
          <GuestActivityCard
            label="Departures Today"
            value={departuresToday}
            color="text-gray-500"
            guests={checkedOutGuests}
            emptyText="No departures"
          />
        </div>

        {/* Booking Sources & Recent Bookings */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
            <h3 className="text-brand-900 mb-4 font-bold">Booking Sources</h3>
            <BookingSourcesTable bookingSources={bookingSources} />
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
            <h3 className="text-brand-900 mb-4 font-bold">Recent Bookings</h3>
            <RecentBookingsTable recentBookings={recentBookings} />
          </div>
        </div>

        {/* F&B Top Items */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          <h3 className="text-brand-900 mb-4 font-bold">Top F&B Items</h3>
          <TopFoodItemsTable topFoodItems={topFoodItems} />
        </div>

        {/* Service Requests */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
            <h3 className="text-brand-900 mb-4 font-bold">
              Service Request Status
            </h3>
            <ServiceRequestStatusChart
              serviceRequestsByStatus={serviceRequestsByStatus}
            />
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
            <h3 className="text-brand-900 mb-4 font-bold">
              Service Request Types
            </h3>
            <ServiceRequestTypesTable
              serviceRequestsByType={serviceRequestsByType}
            />
          </div>
        </div>

        {/* Key Metrics Summary */}
        <div className="bg-brand-900 rounded-2xl p-5">
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
        </div>
      </div>
    </>
  );
}
