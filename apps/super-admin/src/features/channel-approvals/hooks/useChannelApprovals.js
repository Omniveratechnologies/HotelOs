import {
  useQuery,
  useMutation,
  useQueryClient,
  queryKeys,
} from "@hotelos/query";
import { hotelsApi } from "@hotelos/api";

/**
 * Hook to fetch hotel channel manager mapping approval requests.
 *
 * @param {object} [filters={}] - Filter criteria (kind, status)
 * @returns {object} Query result with approvals array, refresh callback, and loading/error states
 */
export function useChannelApprovals(filters = {}) {
  const query = useQuery({
    queryKey: queryKeys.hotels.channelApprovals(filters),
    queryFn: async () => {
      const data = await hotelsApi.getChannelApprovals(filters);
      return data || [];
    },
  });

  return {
    ...query,
    approvals: query.data || [],
    refresh: query.refetch,
    isLoading: query.isLoading,
    error: query.error
      ? query.error.message || "Failed to load channel approvals"
      : null,
  };
}

/**
 * Mutation hook to verify and activate a channel manager mapping approval.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useVerifyChannelApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (approvalId) => hotelsApi.verifyChannelApproval(approvalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hotels.all });
    },
  });
}
