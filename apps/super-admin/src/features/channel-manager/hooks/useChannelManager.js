import {
  useQuery,
  useMutation,
  useQueryClient,
  queryKeys,
} from "@hotelos/query";
import { hotelsApi } from "@hotelos/api";

/**
 * Hook to fetch super-admin channel manager configuration.
 * @returns {object} Query result with config object, isLoading, and error.
 */
export function useChannelManagerConfig() {
  const query = useQuery({
    queryKey: queryKeys.hotels.channelConfig(),
    queryFn: () => hotelsApi.getChannelManagerConfig(),
  });

  return {
    ...query,
    config: query.data || null,
    isLoading: query.isLoading,
    error: query.error
      ? query.error.message || "Failed to load channel manager config"
      : null,
  };
}

/**
 * Mutation hook to update channel manager configuration.
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useUpdateChannelManagerConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => hotelsApi.updateChannelManagerConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.hotels.channelConfig(),
      });
    },
  });
}

/**
 * Hook to fetch live rates for a hotel and rate plan.
 * @param {object} [params={}] Filter parameters containing hotelId, ratePlanId, startDate, endDate.
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useLiveRates(params = {}) {
  return useQuery({
    queryKey: queryKeys.ratePlans.liveRates(params),
    queryFn: () => hotelsApi.getLiveRates(params),
    enabled: !!params.hotelId,
  });
}

/**
 * Mutation hook to update live rates.
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useUpdateLiveRates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => hotelsApi.updateLiveRates(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ratePlans.all });
    },
  });
}

/**
 * Mutation hook to update rate restrictions.
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useUpdateRateRestrictions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => hotelsApi.updateRateRestrictions(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ratePlans.all });
    },
  });
}

/**
 * Hook to fetch live inventory for a hotel.
 * @param {object} [params={}] Filter parameters containing hotelId, roomTypeId, startDate, endDate.
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useLiveInventory(params = {}) {
  return useQuery({
    queryKey: queryKeys.hotels.liveInventory(params),
    queryFn: () => hotelsApi.getLiveInventory(params),
    enabled: !!params.hotelId,
  });
}

/**
 * Mutation hook to update live inventory.
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useUpdateLiveInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => hotelsApi.updateLiveInventory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.hotels.liveInventory(),
      });
    },
  });
}

/**
 * Mutation hook to update inventory restrictions.
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useUpdateInventoryRestrictions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => hotelsApi.updateInventoryRestrictions(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.hotels.liveInventory(),
      });
    },
  });
}

/**
 * Mutation hook to mark a channel reservation as no-show.
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useMarkChannelNoShow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => hotelsApi.markChannelNoShow(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hotels.all });
    },
  });
}
