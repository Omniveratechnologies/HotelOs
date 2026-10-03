import {
  useQuery,
  useMutation,
  useQueryClient,
  queryKeys,
} from "@hotelos/query";
import { roomsApi } from "@hotelos/api";

/**
 * Hook to fetch hotel rooms for sub-admin inventory management.
 *
 * @returns {object} Query result with rooms array and loading/error states
 */
export function useRooms() {
  const query = useQuery({
    queryKey: queryKeys.rooms.all,
    queryFn: async () => {
      const data = await roomsApi.getRooms();
      return data || [];
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
 * Mutation hook to create a new hotel room.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newRoomData) => roomsApi.createRoom(newRoomData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
    },
  });
}

/**
 * Mutation hook to update hotel room configuration and details.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useUpdateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => roomsApi.updateRoom(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
    },
  });
}

/**
 * Mutation hook to delete a hotel room.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => roomsApi.deleteRoom(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
    },
  });
}
