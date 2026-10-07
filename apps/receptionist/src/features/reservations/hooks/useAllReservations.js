import { useQuery, useMutation, useQueryClient } from "@hotelos/query";
import { reservationsApi } from "@hotelos/api";
import { normalizeReservation } from "./useReservations.js";

/**
 * Server-filtered reservation list for the All Reservations page.
 *
 * @param {Object} filters - { status?, source?, otaChannel?, roomType?, q?, from?, to?, page?, limit?, sort? }
 */
export function useAllReservations(filters) {
  const query = useQuery({
    queryKey: ["reservations", "list", filters || {}],
    queryFn: () => reservationsApi.getReservationsWithFilters(filters),
    placeholderData: (prev) => prev,
  });

  return {
    reservations: (query.data?.data || []).map(normalizeReservation),
    pagination: query.data?.pagination || {
      page: 1,
      limit: 50,
      total: 0,
      pages: 1,
    },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error
      ? query.error.message || "Failed to load reservations"
      : null,
  };
}

function useInvalidateReservations() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["reservations"] });
    queryClient.invalidateQueries({ queryKey: ["guests"] });
    queryClient.invalidateQueries({ queryKey: ["rooms"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };
}

export function useCancelReservation() {
  const invalidate = useInvalidateReservations();
  return useMutation({
    mutationFn: ({ id, reason }) =>
      reservationsApi.cancelReservation(id, { reason }),
    onSuccess: invalidate,
  });
}

export function useReconfirmReservation() {
  const invalidate = useInvalidateReservations();
  return useMutation({
    mutationFn: (id) => reservationsApi.reconfirmReservation(id),
    onSuccess: invalidate,
  });
}

export function useChangeReservationRoom() {
  const invalidate = useInvalidateReservations();
  return useMutation({
    mutationFn: ({ id, roomId, note }) =>
      reservationsApi.changeReservationRoom(id, { roomId, note }),
    onSuccess: invalidate,
  });
}

export function useExtendReservationStay() {
  const invalidate = useInvalidateReservations();
  return useMutation({
    mutationFn: ({ id, checkOut }) =>
      reservationsApi.extendReservationStay(id, { checkOut }),
    onSuccess: invalidate,
  });
}

/** Audit trail of one reservation (drawer History tab). */
export function useReservationHistory(id, enabled = true) {
  const query = useQuery({
    queryKey: ["reservations", "history", id],
    queryFn: () => reservationsApi.getReservationHistory(id),
    enabled: enabled && Boolean(id),
  });

  return {
    history: query.data?.history || [],
    isLoading: query.isLoading,
  };
}
