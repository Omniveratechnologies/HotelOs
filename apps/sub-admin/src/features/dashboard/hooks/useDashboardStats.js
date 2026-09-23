import { useQuery, queryKeys } from "@hotelos/query";
import { dashboardApi } from "@hotelos/api";

/**
 * Hook to fetch hotel administrator dashboard metrics (occupancy, revenue, requests).
 *
 * @returns {object} Query result with stats object and loading/error states
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
  };
}
