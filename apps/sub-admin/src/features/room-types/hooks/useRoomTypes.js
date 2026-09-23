import {
  useQuery,
  useMutation,
  useQueryClient,
  queryKeys,
} from "@hotelos/query";
import { roomTypesApi } from "@hotelos/api";

/**
 * Hook to fetch hotel room types for sub-admin management.
 *
 * @returns {object} Query result with roomTypes array and loading/error states
 */
export function useRoomTypes() {
  const query = useQuery({
    queryKey: queryKeys.roomTypes.list(),
    queryFn: async () => {
      const data = await roomTypesApi.getRoomTypes();
      return data || [];
    },
  });

  return {
    ...query,
    roomTypes: query.data || [],
    isLoading: query.isLoading,
    error: query.error
      ? query.error.message || "Failed to load room types"
      : null,
  };
}

/**
 * Mutation hook to create a new room type.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useCreateRoomType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => roomTypesApi.createRoomType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roomTypes.all });
    },
  });
}

/**
 * Mutation hook to update an existing room type.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useUpdateRoomType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => roomTypesApi.updateRoomType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roomTypes.all });
    },
  });
}

/**
 * Mutation hook to delete a room type.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useDeleteRoomType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => roomTypesApi.deleteRoomType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roomTypes.all });
    },
  });
}
