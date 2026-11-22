import {
  useQuery,
  useMutation,
  useQueryClient,
  queryKeys,
} from "@hotelos/query";
import { staffApi, invitationsApi } from "@hotelos/api";
import type {
  SubAdminStaff,
  CreateStaffPayload,
  UpdateStaffPayload,
} from "../types.ts";

/**
 * Hook to fetch hotel staff members filtered by query parameters.
 */
export function useStaff(params: string | Record<string, unknown> = "ALL") {
  const queryParamObj =
    typeof params === "string"
      ? params === "ALL"
        ? {}
        : { role: params }
      : params;

  const query = useQuery({
    queryKey: [...queryKeys.staff.all, queryParamObj],
    queryFn: async (): Promise<SubAdminStaff[]> => {
      const data = await staffApi.fetchStaff(queryParamObj);
      return (data || []) as SubAdminStaff[];
    },
  });

  return {
    ...query,
    staff: (query.data || []) as SubAdminStaff[],
    loadStaff: query.refetch,
    isLoading: query.isLoading,
    error: query.error
      ? (query.error as Error).message || "Failed to load staff"
      : null,
  };
}

/**
 * Mutation hook to create a new hotel staff member.
 */
export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStaffPayload | Record<string, unknown>) =>
      staffApi.createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
  });
}

/**
 * Mutation hook to update a hotel staff member.
 */
export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateStaffPayload | Record<string, unknown>;
    }) => staffApi.updateStaff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
  });
}

/**
 * Mutation hook to delete a hotel staff member.
 */
export function useDeleteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (staffId: string) => staffApi.deleteStaff(staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
  });
}

/**
 * Mutation hook to reset a staff member's password.
 */
export function useResetStaffPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      staffApi.resetStaffPassword(id, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
  });
}

/**
 * Mutation hook to send an invitation email to a new staff member.
 */
export function useSendStaffInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteData: unknown) =>
      invitationsApi.sendStaffInvitation(inviteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.all });
    },
  });
}
