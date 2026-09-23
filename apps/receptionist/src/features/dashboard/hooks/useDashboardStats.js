import { useQuery, queryKeys } from "@hotelos/query";
import { dashboardApi } from "@hotelos/api";

/**
 * Hook to fetch receptionist dashboard statistics (occupancy, active bookings, pending requests).
 *
 * @returns {object} Query result with stats object, loading/error states, and refreshStats callback
 */
export function useDashboardStats() {
  const query = useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: async () => {
      return dashboardApi.getDashboardStats();
    },
  });

  return {
    ...query,
    stats: query.data || null,
    isLoading: query.isLoading,
    error: query.error ? query.error.message || "Failed to load stats" : null,
    refreshStats: query.refetch,
  };
}
