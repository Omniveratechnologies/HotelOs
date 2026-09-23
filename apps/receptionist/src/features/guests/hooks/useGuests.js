import {
  useQuery,
  useMutation,
  useQueryClient,
  queryKeys,
} from "@hotelos/query";
import { guestsApi } from "@hotelos/api";
import { normalizeGuest } from "@hotelos/utils";

/**
 * Hook to fetch and normalize the list of guests filtered by status.
 *
 * @param {string} [status='all'] - Status filter ('all', 'checked_in', 'checked_out')
 * @returns {object} Query result with guests array and loading/error states
 */
export function useGuests(status = "all") {
  const query = useQuery({
    queryKey: queryKeys.guests.list(status),
    queryFn: async () => {
      const data = await guestsApi.getGuests(status);
      return (data || []).map(normalizeGuest);
    },
  });

  return {
    ...query,
    guests: query.data || [],
    isLoading: query.isLoading,
    error: query.error ? query.error.message || "Failed to load guests" : null,
  };
}

/**
 * Hook to fetch details for a single guest booking.
 *
 * @param {string} bookingId - Booking or guest ID
 * @returns {import("@tanstack/react-query").UseQueryResult}
 */
export function useGuest(bookingId) {
  return useQuery({
    queryKey: queryKeys.guests.detail(bookingId),
    queryFn: async () => {
      if (!bookingId) return null;
      const data = await guestsApi.getGuest(bookingId);
      return normalizeGuest(data);
    },
    enabled: !!bookingId,
  });
}

/**
 * Mutation hook to register a new guest and invalidate guests/rooms/dashboard caches.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useRegisterGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (guestData) => guestsApi.registerGuest(guestData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
}

/**
 * Mutation hook to delete a guest booking.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useDeleteGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId) => guestsApi.deleteGuest(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
}

/**
 * Mutation hook to update a guest booking record.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useUpdateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, updates }) =>
      guestsApi.updateBooking(bookingId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
    },
  });
}

/**
 * Mutation hook to update guest personal profile information.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useUpdateGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ guestId, updates }) =>
      guestsApi.updateGuest(guestId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guests.all });
    },
  });
}

/**
 * Mutation hook to update guest portal credentials.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
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
 * Mutation hook to remove an uploaded identity document from a guest record.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useDeleteGuestDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ guestId, docId }) =>
      guestsApi.deleteGuestDocument(guestId, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guests.all });
    },
  });
}
