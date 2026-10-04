import {
  useQuery,
  useMutation,
  useQueryClient,
  queryKeys,
} from "@hotelos/query";
import { reservationsApi } from "@hotelos/api";

export function normalizeReservation(item) {
  if (!item) return null;
  const room = item.room || {};
  return {
    id: item.id || item._id,
    _id: item._id || item.id,
    reservationNo: item.reservationNo || null,
    source: item.source || item.channel || "DIRECT",
    guestId: item.guestId,
    name: item.name || "Guest",
    email: item.email || "",
    phone: item.phone || "",
    address: item.address || "",
    nationality: item.nationality || null,
    idType: item.idType || "Aadhaar",
    idNumber: item.idNumber || "",
    roomId: item.roomId || item.room?.id || null,
    roomNumber: room.roomNumber ? String(room.roomNumber) : "",
    roomType: room.type || "",
    roomRate: room.rate != null ? room.rate : null,
    floor: room.floor,
    room,
    roomTypeCode: item.roomTypeCode || room.roomCode || "",
    ratePlan: item.ratePlan || null,
    mealPlan: item.mealPlan || null,
    checkIn: item.checkIn ? String(item.checkIn).split("T")[0] : null,
    checkOut: item.checkOut ? String(item.checkOut).split("T")[0] : null,
    nights: item.nights ?? null,
    rooms: item.rooms ?? 1,
    adults: item.adults ?? 1,
    children: item.children ?? 0,
    infants: item.infants ?? 0,
    guestType: item.guestType || "individual",
    status: item.status || "reserved",
    channel: item.channel || "DIRECT",
    aiosellBookingId: item.aiosellBookingId || null,
    pricing: item.pricing || null,
    paymentStatus: item.paymentStatus || "unpaid",
    otaInfo: item.otaInfo || null,
    cancellation: item.cancellation || null,
    auditTrail: item.auditTrail || [],
    totalAmount:
      item.pricing?.grandTotal ??
      (item.totalAmountBeforeTax != null
        ? item.totalAmountBeforeTax + (item.tax || 0)
        : room.rate || 0),
    tax: item.pricing?.taxAmount ?? item.tax ?? 0,
    specialRequests: item.specialRequests || "",
    documents: item.documents || [],
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export function useReservations(status = "all") {
  const query = useQuery({
    queryKey: queryKeys.reservations.list(status),
    queryFn: async () => {
      const data = await reservationsApi.getReservations(status);
      return (data || []).map(normalizeReservation);
    },
  });

  return {
    ...query,
    reservations: query.data || [],
    isLoading: query.isLoading,
    error: query.error
      ? query.error.message || "Failed to load reservations"
      : null,
    refetch: query.refetch,
  };
}

export function useReservation(id) {
  return useQuery({
    queryKey: queryKeys.reservations.detail(id),
    queryFn: async () => {
      if (!id) return null;
      const data = await reservationsApi.getReservation(id);
      return normalizeReservation(data);
    },
    enabled: !!id,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => reservationsApi.createReservation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.guests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
}

export function useUpdateReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }) =>
      reservationsApi.updateReservation(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.guests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
}

export function useDeleteReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => reservationsApi.deleteReservation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.guests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
}
