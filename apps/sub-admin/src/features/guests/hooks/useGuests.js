import {
  useQuery,
  useMutation,
  useQueryClient,
  queryKeys,
} from "@hotelos/query";
import { guestsApi } from "@hotelos/api";

/**
 * Hook to fetch guests directory list with search and status filters.
 * @param {object} [filters={}]
 */
export function useGuests(filters = {}) {
  const query = useQuery({
    queryKey: queryKeys.guests.list(filters),
    queryFn: async () => {
      const data = await guestsApi.getGuestsList(filters);
      return data || [];
    },
  });

  return {
    ...query,
    guests: query.data || [],
    isLoading: query.isLoading,
    error: query.error ? query.error.message || "Failed to load guests" : null,
    refetch: query.refetch,
  };
}

/**
 * Hook to fetch detailed profile for a single guest.
 * @param {string} guestId
 */
export function useGuest(guestId) {
  return useQuery({
    queryKey: queryKeys.guests.detail(guestId),
    queryFn: async () => {
      if (!guestId) return null;
      return guestsApi.getGuestDetails(guestId);
    },
    enabled: !!guestId,
  });
}

/**
 * Mutation hook to update guest personal profile information.
 */
export function useUpdateGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ guestId, updates }) =>
      guestsApi.updateGuest(guestId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all });
    },
  });
}

/**
 * Mutation hook to update or regenerate guest portal credentials.
 */
export function useUpdateGuestCredentials() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ guestId, payload }) =>
      guestsApi.updateGuestCredentials(guestId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guests.all });
    },
  });
}

/**
 * Mutation hook to remove an uploaded identity document from a guest.
 */
export function useDeleteGuestDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ guestId, docId }) =>
      guestsApi.deleteGuestDocument(guestId, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all });
    },
  });
}

/**
 * Mutation hook to remove a guest account / stay.
 */
export function useDeleteGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (guestStayId) => guestsApi.deleteGuest(guestStayId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
}
