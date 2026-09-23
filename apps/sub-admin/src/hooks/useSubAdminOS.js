import { useQueryClient, queryKeys } from "@hotelos/query";
import {
  useRooms,
  useCreateRoom,
  useUpdateRoom,
  useDeleteRoom,
} from "../features/rooms/hooks/useRooms.js";
import {
  useRoomTypes,
  useCreateRoomType,
  useUpdateRoomType,
  useDeleteRoomType,
} from "../features/room-types/hooks/useRoomTypes.js";
import {
  useRatePlans,
  useCreateRatePlan,
  useUpdateRatePlan,
  useDeleteRatePlan,
  useSyncRatePlans,
} from "../features/rate-plans/hooks/useRatePlans.js";
import {
  useMembers,
  useDeleteMember,
  useSendMemberInvitation,
} from "../features/members/hooks/useMembers.js";
import { useDashboardStats } from "../features/dashboard/hooks/useDashboardStats.js";
import {
  useMyHotel,
  useUpdateMyHotel,
  useAiosellRoomTypes,
} from "../features/settings/hooks/useHotelSettings.js";

/**
 * Composite hook that provides unified access to sub-admin operations and state.
 * Encapsulates server state via TanStack Query and exposes standardized actions.
 * @returns {object} Combined sub-admin queries, mutations, and refresh methods.
 */
export function useSubAdminOS() {
  const queryClient = useQueryClient();

  const { rooms, isLoading: roomsLoading, error: roomsError } = useRooms();
  const {
    roomTypes,
    isLoading: roomTypesLoading,
    error: roomTypesError,
  } = useRoomTypes();
  const {
    ratePlans,
    isLoading: ratePlansLoading,
    error: ratePlansError,
  } = useRatePlans();
  const {
    members,
    isLoading: membersLoading,
    error: membersError,
  } = useMembers();
  const {
    stats,
    isLoading: statsLoading,
    error: statsError,
    refreshStats,
  } = useDashboardStats();
  const { hotel, isLoading: hotelLoading, error: hotelError } = useMyHotel();
  const { aiosellRoomTypes, isLoading: aiosellLoading } = useAiosellRoomTypes();

  const createRoomMut = useCreateRoom();
  const updateRoomMut = useUpdateRoom();
  const deleteRoomMut = useDeleteRoom();

  const createRoomTypeMut = useCreateRoomType();
  const updateRoomTypeMut = useUpdateRoomType();
  const deleteRoomTypeMut = useDeleteRoomType();

  const createRatePlanMut = useCreateRatePlan();
  const updateRatePlanMut = useUpdateRatePlan();
  const deleteRatePlanMut = useDeleteRatePlan();
  const syncRatePlansMut = useSyncRatePlans();

  const deleteMemberMut = useDeleteMember();
  const sendInviteMut = useSendMemberInvitation();

  const updateHotelMut = useUpdateMyHotel();

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.roomTypes.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.ratePlans.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.hotels.me() }),
    ]);
  };

  return {
    // Queries
    rooms,
    roomsLoading,
    roomsError,
    roomTypes,
    roomTypesLoading,
    roomTypesError,
    ratePlans,
    ratePlansLoading,
    ratePlansError,
    members,
    membersLoading,
    membersError,
    stats,
    statsLoading,
    statsError,
    hotel,
    hotelLoading,
    hotelError,
    aiosellRoomTypes,
    aiosellLoading,

    // Actions & Mutations
    refreshStats,
    refreshAll,
    createRoom: (data) => createRoomMut.mutateAsync(data),
    updateRoom: (id, updates) => updateRoomMut.mutateAsync({ id, updates }),
    deleteRoom: (id) => deleteRoomMut.mutateAsync(id),
    createRoomType: (data) => createRoomTypeMut.mutateAsync(data),
    updateRoomType: (id, data) => updateRoomTypeMut.mutateAsync({ id, data }),
    deleteRoomType: (id) => deleteRoomTypeMut.mutateAsync(id),
    createRatePlan: (data) => createRatePlanMut.mutateAsync(data),
    updateRatePlan: (id, data) => updateRatePlanMut.mutateAsync({ id, data }),
    deleteRatePlan: (id) => deleteRatePlanMut.mutateAsync(id),
    syncRatePlans: (range) => syncRatePlansMut.mutateAsync(range),
    deleteMember: (id) => deleteMemberMut.mutateAsync(id),
    sendMemberInvite: (data) => sendInviteMut.mutateAsync(data),
    updateHotel: (data) => updateHotelMut.mutateAsync(data),
  };
}
