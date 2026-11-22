import {
  useQuery,
  useMutation,
  useQueryClient,
  queryKeys,
} from "@hotelos/query";
import { membersApi } from "@hotelos/api";

/**
 * Hook to fetch hotel staff members filtered by query parameters.
 *
 * @param {object|string} [params="ALL"] - Filter options { role, search, status } or role string
 * @returns {object} Query result with members array, loadMembers refetch alias, and loading/error states
 */
export function useMembers(params = "ALL") {
  const queryParamObj =
    typeof params === "string"
      ? params === "ALL"
        ? {}
        : { role: params }
      : params;

  const query = useQuery({
    queryKey: [...queryKeys.members.all, queryParamObj],
    queryFn: async () => {
      const data = await membersApi.fetchMembers(queryParamObj);
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
 * Mutation hook to create a new hotel staff member.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => membersApi.createMember(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
    },
  });
}

/**
 * Mutation hook to update a hotel staff member.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => membersApi.updateMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
    },
  });
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
 * Mutation hook to reset a staff member's password.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useResetMemberPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, password }) =>
      membersApi.resetMemberPassword(id, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
    },
  });
}
