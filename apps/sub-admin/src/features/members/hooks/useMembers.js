import {
  useQuery,
  useMutation,
  useQueryClient,
  queryKeys,
} from "@hotelos/query";
import { membersApi, invitationsApi } from "@hotelos/api";

/**
 * Hook to fetch hotel staff members filtered by role.
 *
 * @param {string} [role='RECEPTIONIST'] - Target member role
 * @returns {object} Query result with members array, loadMembers refetch alias, and loading/error states
 */
export function useMembers(role = "RECEPTIONIST") {
  const query = useQuery({
    queryKey: queryKeys.members.list(role),
    queryFn: async () => {
      const data = await membersApi.fetchMembers(role);
      return data || [];
    },
  });

  return {
    ...query,
    members: query.data || [],
    loadMembers: query.refetch,
    isLoading: query.isLoading,
    error: query.error ? query.error.message || "Failed to load members" : null,
  };
}

/**
 * Mutation hook to delete a hotel staff member.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId) => membersApi.deleteMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
    },
  });
}

/**
 * Mutation hook to send an invitation email to a new staff member.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useSendMemberInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteData) => invitationsApi.sendMemberInvitation(inviteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.all });
    },
  });
}
