import {
  useQuery,
  useMutation,
  useQueryClient,
  queryKeys,
} from "@hotelos/query";
import { subscriptionsApi } from "@hotelos/api";

/**
 * Hook to fetch subscriptions for all hotels.
 * @returns {object} Query result with subscriptions array, isLoading, and error.
 */
export function useSubscriptions() {
  const query = useQuery({
    queryKey: queryKeys.subscriptions.list(),
    queryFn: async () => {
      const data = await subscriptionsApi.fetchSubscriptions();
      return data || [];
    },
  });

  return {
    ...query,
    subscriptions: query.data || [],
    isLoading: query.isLoading,
    error: query.error
      ? query.error.message || "Failed to load subscriptions"
      : null,
  };
}

/**
 * Mutation hook to save or update subscription for a hotel.
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useSaveSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ hotelId, data }) =>
      subscriptionsApi.saveSubscription(hotelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.hotels.all });
    },
  });
}
