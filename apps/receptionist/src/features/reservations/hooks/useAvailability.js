import { useQuery } from "@hotelos/query";
import { reservationsApi } from "@hotelos/api";

/**
 * Per-room-type availability for a date range (booking availability check).
 * Enabled only when both dates are valid and check-out is after check-in.
 *
 * @param {{ checkIn?: string, checkOut?: string }} params - ISO date strings.
 * @returns {{ availability: Array<object>, isLoading: boolean, error: string|null }}
 */
export function useAvailability({ checkIn, checkOut }) {
  const valid =
    Boolean(checkIn) &&
    Boolean(checkOut) &&
    new Date(checkOut) > new Date(checkIn);

  const query = useQuery({
    queryKey: [
      "reservations",
      "availability",
      { checkIn: checkIn || "", checkOut: checkOut || "" },
    ],
    queryFn: () => reservationsApi.getAvailability({ checkIn, checkOut }),
    enabled: valid,
  });

  return {
    availability: query.data || [],
    isLoading: valid ? query.isLoading : false,
    error: query.error
      ? query.error.message || "Failed to load availability"
      : null,
  };
}
