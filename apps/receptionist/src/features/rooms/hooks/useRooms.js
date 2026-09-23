import {
  useQuery,
  useMutation,
  useQueryClient,
  queryKeys,
} from "@hotelos/query";
import { roomsApi } from "@hotelos/api";
import { normalizeRoom } from "@hotelos/utils";

/**
 * Hook to fetch and normalize the full list of rooms.
 *
 * @returns {object} Query result with rooms array and loading/error states
 */
export function useRooms() {
  const query = useQuery({
    queryKey: queryKeys.rooms.all,
    queryFn: async () => {
      const data = await roomsApi.getRooms();
      return (data || []).map(normalizeRoom);
    },
  });

  return {
    ...query,
    rooms: query.data || [],
    isLoading: query.isLoading,
    error: query.error ? query.error.message || "Failed to load rooms" : null,
  };
}

/**
 * Mutation hook to create a new room and invalidate room cache.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newRoomData) => roomsApi.createRoom(newRoomData),
    onSuccess: (createdRoom) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
      return normalizeRoom(createdRoom);
    },
  });
}

/**
 * Mutation hook to update room attributes.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useUpdateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roomId, updates }) => roomsApi.updateRoom(roomId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
    },
  });
}

/**
 * Mutation hook to update room status (e.g. clean, dirty, occupied) and attached guest data.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useUpdateRoomStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, status, guestData = {} }) => {
      const body = { status };
      if ("guest" in guestData) body.currentGuest = guestData.guest || "";
      if ("checkIn" in guestData) body.checkIn = guestData.checkIn || null;
      if ("checkOut" in guestData) body.checkOut = guestData.checkOut || null;

      return roomsApi.updateRoom(roomId, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.guests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
}

/**
 * Mutation hook to delete a room.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomId) => roomsApi.deleteRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
}
