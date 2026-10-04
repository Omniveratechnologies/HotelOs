import { useQuery } from "@hotelos/query";
import { reservationsApi } from "@hotelos/api";

/**
 * Lightweight guest lookup for the "Existing Guest" tab. Enabled when the
 * query has at least 2 characters (or is empty — returns recent guests).
 *
 * @param {string} q
 * @param {boolean} [enabled=true]
 */
export function useGuestSearch(q, enabled = true) {
  const trimmed = (q || "").trim();

  const query = useQuery({
    queryKey: ["guests", "search", trimmed],
    queryFn: () => reservationsApi.searchGuests(trimmed),
    enabled,
    staleTime: 15_000,
  });

  return {
    results: query.data || [],
    isSearching: query.isLoading || query.isFetching,
    error: query.error ? query.error.message || "Search failed" : null,
  };
}
