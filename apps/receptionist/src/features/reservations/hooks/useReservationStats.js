import { useQuery } from "@hotelos/query";
import { reservationsApi } from "@hotelos/api";

/**
 * Reservation KPI stats + tab/OTA-channel counts + today summary.
 *
 * @returns {{ stats: object|null, isLoading: boolean, error: string|null }}
 */
export function useReservationStats() {
  const query = useQuery({
    queryKey: ["reservations", "stats"],
    queryFn: () => reservationsApi.getReservationStats(),
  });

  return {
    stats: query.data || null,
    isLoading: query.isLoading,
    error: query.error ? query.error.message || "Failed to load stats" : null,
  };
}
