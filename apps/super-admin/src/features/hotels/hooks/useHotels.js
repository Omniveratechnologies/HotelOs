import {
  useQuery,
  useMutation,
  useQueryClient,
  queryKeys,
} from "@hotelos/query";
import { hotelsApi } from "@hotelos/api";

/**
 * Hook to fetch all hotels for super-admin dashboard.
 * @returns {object} Query result with hotels array, isLoading, and error.
 */
export function useHotels() {
  const query = useQuery({
    queryKey: queryKeys.hotels.list(),
    queryFn: async () => {
      const data = await hotelsApi.getHotels();
      return data || [];
    },
  });

  return {
    ...query,
    hotels: query.data || [],
    isLoading: query.isLoading,
    error: query.error ? query.error.message || "Failed to load hotels" : null,
  };
}

/**
 * Hook to fetch a single hotel by ID.
 * @param {string} hotelId
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useHotel(hotelId) {
  return useQuery({
    queryKey: queryKeys.hotels.detail(hotelId),
    queryFn: () => hotelsApi.getHotelById(hotelId),
    enabled: !!hotelId,
  });
}

/**
 * Mutation hook to create a new hotel.
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useCreateHotel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => hotelsApi.createNewHotel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hotels.all });
    },
  });
}

/**
 * Mutation hook to update an existing hotel's details.
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useUpdateHotel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => hotelsApi.updateHotelDetails(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hotels.all });
    },
  });
}

/**
 * Mutation hook to update a hotel's active/inactive status.
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useUpdateHotelStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) => hotelsApi.updateHotelStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hotels.all });
    },
  });
}

/**
 * Mutation hook to delete a hotel.
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useDeleteHotel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => hotelsApi.removeHotel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hotels.all });
    },
  });
}

/**
 * Mutation hook to associate an Aiosell hotel code with a hotel.
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useSetHotelAiosellCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ hotelId, aiosellHotelCode }) =>
      hotelsApi.setHotelAiosellCode(hotelId, aiosellHotelCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hotels.all });
    },
  });
}

/**
 * Mutation hook to trigger hotel synchronization from Aiosell.
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useSyncHotelFromAiosell() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (hotelId) => hotelsApi.syncHotelFromAiosell(hotelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hotels.all });
    },
  });
}
