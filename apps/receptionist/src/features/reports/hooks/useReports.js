import { useMemo } from "react";
import { useRooms } from "../../rooms/hooks/useRooms.js";
import { useGuests } from "../../guests/hooks/useGuests.js";
import { useOrders } from "../../food-orders/hooks/useOrders.js";
import { useRequests } from "../../housekeeping/hooks/useRequests.js";

const DEFAULT_ROOM_TYPES = ["Standard", "Deluxe", "Suite"];

/**
 * Hook to compute aggregated hotel operational reports from server state queries.
 * @param {Array<string>} [roomTypes=DEFAULT_ROOM_TYPES] - List of room type categories
 * @returns {object} Aggregated report metrics, loading states, and refetch helpers.
 */
export function useReports(roomTypes = DEFAULT_ROOM_TYPES) {
  const {
    rooms,
    isLoading: roomsLoading,
    error: roomsError,
    refetch: refetchRooms,
  } = useRooms();
  const {
    guests,
    isLoading: guestsLoading,
    error: guestsError,
    refetch: refetchGuests,
  } = useGuests();
  const {
    foodOrders,
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useOrders();
  const {
    serviceRequests,
    isLoading: requestsLoading,
    error: requestsError,
    refetch: refetchRequests,
  } = useRequests();

  const isLoading =
    roomsLoading || guestsLoading || ordersLoading || requestsLoading;
  const error =
    roomsError || guestsError || ordersError || requestsError || null;

  const metrics = useMemo(() => {
    const occupied = rooms.filter((r) => r.status === "occupied");
    const available = rooms.filter((r) => r.status === "available");
    const reserved = rooms.filter((r) => r.status === "reserved");
    const cleaning = rooms.filter((r) => r.status === "cleaning");
    const total = rooms.length;
    const occupancyRate =
      total > 0 ? Math.round((occupied.length / total) * 100) : 0;

    const roomRevenue = occupied.reduce((sum, r) => sum + (r.rate || 0), 0);
    const foodRevenue = foodOrders
      .filter((o) => o.status === "delivered")
      .reduce((sum, o) => sum + (o.amount || 0), 0);
    const avgDailyRate =
      occupied.length > 0 ? Math.round(roomRevenue / occupied.length) : 0;

    const byType = roomTypes.map((type) => {
      const occ = occupied.filter((r) => r.type === type);
      const totalInType = rooms.filter((r) => r.type === type).length;
      return {
        type,
        total: totalInType,
        occupied: occ.length,
        avgRate:
          occ.length > 0
            ? Math.round(
                occ.reduce((sum, r) => sum + (r.rate || 0), 0) / occ.length,
              )
            : 0,
        revenue: occ.reduce((sum, r) => sum + (r.rate || 0), 0),
      };
    });

    const checkedInGuests = guests.filter((g) => g.status === "checked-in");
    const reservedGuests = guests.filter((g) => g.status === "reserved");
    const checkedOutGuests = guests.filter((g) => g.status === "checked-out");

    const reportDate = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    return {
      total,
      occupied,
      available,
      reserved,
      cleaning,
      occupancyRate,
      roomRevenue,
      foodRevenue,
      avgDailyRate,
      byType,
      checkedInGuests,
      reservedGuests,
      checkedOutGuests,
      reportDate,
    };
  }, [rooms, guests, foodOrders, roomTypes]);

  const refetchAll = async () => {
    await Promise.all([
      refetchRooms(),
      refetchGuests(),
      refetchOrders(),
      refetchRequests(),
    ]);
  };

  return {
    ...metrics,
    rooms,
    guests,
    foodOrders,
    serviceRequests,
    isLoading,
    error,
    refetchAll,
  };
}
