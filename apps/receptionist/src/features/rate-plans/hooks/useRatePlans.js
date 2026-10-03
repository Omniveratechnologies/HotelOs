import {
  useQuery,
  useMutation,
  useQueryClient,
  queryKeys,
} from "@hotelos/query";
import { ratePlansApi } from "@hotelos/api";

/**
 * Hook to fetch hotel rate plans.
 *
 * @returns {object} Query result with ratePlans array and loading state
 */
export function useRatePlans() {
  const query = useQuery({
    queryKey: queryKeys.ratePlans.list(),
    queryFn: async () => {
      const data = await ratePlansApi.getRatePlans();
      return data || [];
    },
  });

  return {
    ...query,
    ratePlans: query.data || [],
    isLoading: query.isLoading,
  };
}

/**
 * Mutation hook to create a new rate plan.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useCreateRatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => ratePlansApi.createRatePlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ratePlans.all });
    },
  });
}

/**
 * Mutation hook to update an existing rate plan.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useUpdateRatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => ratePlansApi.updateRatePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ratePlans.all });
    },
  });
}

/**
 * Mutation hook to delete a rate plan.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useDeleteRatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => ratePlansApi.deleteRatePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ratePlans.all });
    },
  });
}

/**
 * Mutation hook to trigger a sync of rate plans with external channel managers.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useSyncRatePlans() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dateRange) => ratePlansApi.syncRatePlans(dateRange),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ratePlans.all });
    },
  });
}

/**
 * Hook to fetch live distribution rates for a given date range.
 *
 * @param {object} [dateRange={}] - Start and end dates
 * @returns {import("@tanstack/react-query").UseQueryResult}
 */
export function useLiveRates(dateRange = {}) {
  return useQuery({
    queryKey: queryKeys.ratePlans.liveRates(dateRange),
    queryFn: () => ratePlansApi.getLiveRates(dateRange),
  });
}

/**
 * Mutation hook to update live distribution rates and invalidate cached rate plans.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useUpdateLiveRates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => ratePlansApi.updateLiveRates(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ratePlans.all });
    },
  });
}
