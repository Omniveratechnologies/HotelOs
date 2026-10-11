import { useQuery, queryKeys } from "@hotelos/query";
import { dashboardApi } from "@hotelos/api";

/**
 * Hook to fetch system dashboard health metrics.
 * @returns {object} Query result with health object, isLoading, and error.
 */
export function useDashboardHealth() {
  const query = useQuery({
    queryKey: queryKeys.dashboard.health(),
    queryFn: () => dashboardApi.getDashboardHealth(),
  });

  return {
    ...query,
    health: query.data || null,
    isLoading: query.isLoading,
    error: query.error
      ? query.error.message || "Failed to load health status"
      : null,
  };
}
