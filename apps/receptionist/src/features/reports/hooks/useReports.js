import { useQuery, useQueryClient, queryKeys } from "@hotelos/query";
import { reportsApi } from "@hotelos/api";
import { useMemo } from "react";

const DEFAULT_PERIOD = "today";

/**
 * Hook to fetch comprehensive hotel reports from the backend.
 * @param {object} options - Configuration options
 * @param {string} options.period - 'today', 'week', 'month', 'custom'
 * @param {string} options.startDate - YYYY-MM-DD (for custom period)
 * @param {string} options.endDate - YYYY-MM-DD (for custom period)
 * @returns {object} Report data, loading states, and helpers
 */
export function useReports(options = {}) {
  const { period = DEFAULT_PERIOD, startDate, endDate } = options;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.reports.dashboard(period, startDate, endDate),
    queryFn: async () => {
      const data = await reportsApi.getReportData({
        period,
        startDate,
        endDate,
      });
      return data;
    },
    staleTime: 30000, // 30 seconds
  });

  const metrics = useMemo(() => {
    if (!query.data) return null;

    const { rooms, bookings, revenue, serviceRequests, occupancyTrend } =
      query.data;

    return {
      // Room metrics
      total: rooms.total,
      occupied: rooms.occupied,
      available: rooms.available,
      reserved: rooms.reserved,
      cleaning: rooms.cleaning,
      occupancyRate: rooms.occupancyRate,
      roomsByType: rooms.byType,
      roomsByFloor: rooms.byFloor,

      // Booking metrics
      checkedIn: bookings.checkedIn,
      arrivalsToday: bookings.arrivalsToday,
      departuresToday: bookings.departuresToday,
      totalBookings: bookings.totalBookings,
      bookingsInPeriod: bookings.bookingsInPeriod,
      avgStayDuration: bookings.avgStayDuration,
      bookingSources: bookings.bookingSources,
      recentBookings: bookings.recentBookings,
      checkedInGuests: bookings.recentBookings
        .filter((b) => b.status === "checked-in")
        .map((b) => ({ name: b.guestName })),
      reservedGuests: bookings.recentBookings
        .filter((b) => b.status === "reserved")
        .map((b) => ({ name: b.guestName })),
      checkedOutGuests: bookings.recentBookings
        .filter((b) => b.status === "checked-out")
        .map((b) => ({ name: b.guestName })),

      // Revenue metrics
      roomRevenue: revenue.roomRevenue,
      foodRevenue: revenue.foodRevenue,
      totalRevenue: revenue.totalRevenue,
      avgDailyRate: revenue.avgDailyRate,
      revPAR: revenue.revPAR,
      foodOrderCount: revenue.foodOrderCount,
      avgOrderValue: revenue.avgOrderValue,
      revenueByType: revenue.revenueByType,
      dailyRevenue: revenue.dailyRevenue,
      dailyRoomRevenue: revenue.dailyRoomRevenue,
      topFoodItems: revenue.topFoodItems,

      // Service request metrics
      totalRequests: serviceRequests.totalRequests,
      serviceRequestsByStatus: serviceRequests.byStatus,
      serviceRequestsByType: serviceRequests.byType,
      serviceRequestsByPriority: serviceRequests.byPriority,
      avgResponseTimeMinutes: serviceRequests.avgResponseTimeMinutes,

      // Trends
      occupancyTrend,

      // Period info
      period,
      periodStart: query.data?.period?.start,
      periodEnd: query.data?.period?.end,
      hotelName: query.data?.hotelName,
      reportDate: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    };
  }, [query.data, period]);

  const refetchAll = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
  };

  return {
    ...metrics,
    ...query,
    isLoading: query.isLoading,
    error: query.error,
    refetchAll,
    currentPeriod: { period, startDate, endDate },
  };
}
