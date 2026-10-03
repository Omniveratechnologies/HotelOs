import {
  useQuery,
  useMutation,
  useQueryClient,
  queryKeys,
} from "@hotelos/query";
import { ratePlansApi } from "@hotelos/api";

/**
 * Hook to fetch rate plans for hotel admin.
 *
 * @returns {object} Query result with ratePlans array and loading/error states
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
    error: query.error
      ? query.error.message || "Failed to load rate plans"
      : null,
  };
}

/**
 * Mutation hook to create a new hotel rate plan.
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
 * Mutation hook to synchronize rate plans with external channel managers.
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
 * Hook to fetch live distribution rates for room types and plans.
 *
 * @param {object} [params={}] - Filter parameters (startDate, endDate, hotelId)
 * @returns {import("@tanstack/react-query").UseQueryResult}
 */
export function useLiveRates(params = {}) {
  return useQuery({
    queryKey: queryKeys.ratePlans.liveRates(params),
    queryFn: () => ratePlansApi.getLiveRates(params),
  });
}

/**
 * Mutation hook to update live distribution rates on the channel manager.
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

/**
 * Mutation hook to update channel rate restrictions (closed to arrival/departure, min stay).
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useUpdateRateRestrictions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => ratePlansApi.updateRateRestrictions(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ratePlans.all });
    },
  });
}
