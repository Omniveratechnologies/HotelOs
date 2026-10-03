import {
  useQuery,
  useMutation,
  useQueryClient,
  queryKeys,
} from "@hotelos/query";
import { hotelsApi } from "@hotelos/api";

/**
 * Hook to fetch the currently authenticated hotel profile for receptionist.
 * @returns {object} Query result with hotel profile, loading state, and error.
 */
export function useMyHotel() {
  const query = useQuery({
    queryKey: queryKeys.hotels.me(),
    queryFn: async () => {
      return hotelsApi.getMyHotel();
    },
  });

  return {
    ...query,
    hotel: query.data || null,
    isLoading: query.isLoading,
    error: query.error ? query.error.message || "Failed to load hotel" : null,
  };
}

/**
 * Mutation hook to update hotel profile information.
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useUpdateMyHotel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => hotelsApi.updateMyHotel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hotels.me() });
    },
  });
}

/**
 * Hook to fetch room types mapped in the Aiosell channel manager for this hotel.
 * @returns {object} Query result with aiosellRoomTypes array and loading state
 */
export function useAiosellRoomTypes() {
  const query = useQuery({
    queryKey: queryKeys.hotels.aiosellRoomTypes(),
    queryFn: async () => {
      return hotelsApi.getAiosellRoomTypes();
    },
  });

  return {
    ...query,
    aiosellRoomTypes: query.data || [],
    isLoading: query.isLoading,
    error: query.error
      ? query.error.message || "Failed to load room types"
      : null,
  };
}
