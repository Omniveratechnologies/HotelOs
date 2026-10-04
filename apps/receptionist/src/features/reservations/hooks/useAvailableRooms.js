import { useQuery } from "@hotelos/query";
import { reservationsApi } from "@hotelos/api";

/**
 * Concrete available rooms of a type for a date range (manual assignment).
 * Enabled only when `enabled` is true and dates/type are valid.
 *
 * @param {{ roomTypeCode?: string, checkIn?: string, checkOut?: string, enabled?: boolean }} params
 */
export function useAvailableRooms({
  roomTypeCode,
  checkIn,
  checkOut,
  enabled = true,
}) {
  const valid =
    enabled &&
    Boolean(roomTypeCode) &&
    Boolean(checkIn) &&
    Boolean(checkOut) &&
    new Date(checkOut) > new Date(checkIn);

  const query = useQuery({
    queryKey: [
      "reservations",
      "available-rooms",
      {
        roomTypeCode: roomTypeCode || "",
        checkIn: checkIn || "",
        checkOut: checkOut || "",
      },
    ],
    queryFn: () =>
      reservationsApi.getAvailableRooms({ roomTypeCode, checkIn, checkOut }),
    enabled: valid,
  });

  return {
    rooms: query.data || [],
    isLoading: valid ? query.isLoading : false,
    error: query.error ? query.error.message || "Failed to load rooms" : null,
  };
}
