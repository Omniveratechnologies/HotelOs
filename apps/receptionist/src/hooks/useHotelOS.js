import { useQueryClient, queryKeys } from "@hotelos/query";
import {
  useRooms,
  useCreateRoom,
  useUpdateRoom,
  useUpdateRoomStatus,
  useDeleteRoom,
} from "../features/rooms/hooks/useRooms.js";
import {
  useGuests,
  useRegisterGuest,
  useDeleteGuest,
} from "../features/guests/hooks/useGuests.js";
import {
  useOrders,
  useFoodItems,
  useCreateDeskOrder,
  useUpdateOrderStatus,
} from "../features/food-orders/hooks/useOrders.js";
import {
  useRequests,
  useCreateDeskRequest,
  useAcknowledgeRequest,
  useCompleteRequest,
} from "../features/housekeeping/hooks/useRequests.js";
import { useDashboardStats } from "../features/dashboard/hooks/useDashboardStats.js";
import {
  useRatePlans,
  useCreateRatePlan,
  useUpdateRatePlan,
  useDeleteRatePlan,
  useSyncRatePlans,
} from "../features/rate-plans/hooks/useRatePlans.js";
import { useReports } from "../features/reports/hooks/useReports.js";
import { useChatStore } from "../features/chat/stores/useChatStore.js";

/**
 * Composite hook that provides unified access to receptionist state.
 * Implemented using TanStack Query for server state and Zustand for UI state,
 * eliminating React Context without breaking existing component signatures.
 * @returns {object} Combined server state, UI state, and mutations.
 */
export function useHotelOS() {
  const queryClient = useQueryClient();

  const chatOpen = useChatStore((s) => s.isOpen);
  const setChatOpen = useChatStore((s) => s.setIsOpen);

  const { rooms, isLoading: roomsLoading, error: roomsError } = useRooms();
  const { guests, isLoading: guestsLoading, error: guestsError } = useGuests();
  const {
    stats,
    isLoading: statsLoading,
    error: statsError,
    refreshStats,
  } = useDashboardStats();
  const {
    foodOrders,
    isLoading: ordersLoading,
    error: ordersError,
  } = useOrders();
  const { foodItems, isLoading: foodItemsLoading } = useFoodItems();
  const {
    serviceRequests,
    isLoading: requestsLoading,
    error: requestsError,
  } = useRequests();
  const {
    ratePlans,
    isLoading: ratePlansLoading,
    error: ratePlansError,
  } = useRatePlans();
  const reports = useReports();

  const createRoomMut = useCreateRoom();
  const updateRoomMut = useUpdateRoom();
  const updateStatusMut = useUpdateRoomStatus();
  const deleteRoomMut = useDeleteRoom();

  const registerGuestMut = useRegisterGuest();
  const deleteGuestMut = useDeleteGuest();

  const createOrderMut = useCreateDeskOrder();
  const updateOrderMut = useUpdateOrderStatus();

  const createRequestMut = useCreateDeskRequest();
  const acknowledgeReqMut = useAcknowledgeRequest();
  const completeReqMut = useCompleteRequest();

  const createRatePlanMut = useCreateRatePlan();
  const updateRatePlanMut = useUpdateRatePlan();
  const deleteRatePlanMut = useDeleteRatePlan();
  const syncRatePlansMut = useSyncRatePlans();

  const refreshData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.guests.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.ratePlans.all }),
    ]);
  };

  return {
    // UI state (Zustand)
    chatOpen,
    setChatOpen,

    // Server state (TanStack Query)
    rooms,
    roomsLoading,
    roomsError,
    serviceRequests,
    requestsLoading,
    requestsError,
    foodOrders,
    ordersLoading,
    ordersError,
    foodItems,
    foodItemsLoading,
    guests,
    guestsLoading,
    guestsError,
    stats,
    statsLoading,
    statsError,
    ratePlans,
    ratePlansLoading,
    ratePlansError,
    reports,
    reportsLoading: reports.isLoading,
    reportsError: reports.error,

    // Actions (Mutations)
    refreshStats,
    refreshData,
    updateRoomStatus: (roomId, status, guestData) =>
      updateStatusMut.mutateAsync({ roomId, status, guestData }),
    updateRoom: (roomId, updates) =>
      updateRoomMut.mutateAsync({ roomId, updates }),
    addRoom: (data) => createRoomMut.mutateAsync(data),
    removeRoom: (roomId) => deleteRoomMut.mutateAsync(roomId),
    addGuest: (data) => registerGuestMut.mutateAsync(data),
    removeGuest: (bookingId) => deleteGuestMut.mutateAsync(bookingId),
    updateOrderStatus: (id, status) =>
      updateOrderMut.mutateAsync({ orderId: id, status }),
    addOrder: ({ roomId, items }) =>
      createOrderMut.mutateAsync({ roomId, items }),
    acknowledgeRequest: (id) => acknowledgeReqMut.mutateAsync(id),
    completeRequest: (id) => completeReqMut.mutateAsync(id),
    addRequest: (data) => createRequestMut.mutateAsync(data),
    addRatePlan: (data) => createRatePlanMut.mutateAsync(data),
    updateRatePlan: (id, data) => updateRatePlanMut.mutateAsync({ id, data }),
    removeRatePlan: (id) => deleteRatePlanMut.mutateAsync(id),
    syncRatePlans: (range) => syncRatePlansMut.mutateAsync(range),
  };
}
