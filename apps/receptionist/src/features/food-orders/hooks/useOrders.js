import {
  useQuery,
  useMutation,
  useQueryClient,
  queryKeys,
} from "@hotelos/query";
import { ordersApi } from "@hotelos/api";
import { normalizeFoodOrder, upsert, UI_TO_ORDER_STATUS } from "@hotelos/utils";

/**
 * Hook to fetch and normalize active food orders for hotel staff.
 *
 * @returns {object} Query result with foodOrders array and loading/error states
 */
export function useOrders() {
  const query = useQuery({
    queryKey: queryKeys.orders.staff(),
    queryFn: async () => {
      const data = await ordersApi.getStaffOrders();
      return (data || []).map(normalizeFoodOrder);
    },
  });

  return {
    ...query,
    foodOrders: query.data || [],
    isLoading: query.isLoading,
    error: query.error
      ? query.error.message || "Failed to load food orders"
      : null,
  };
}

/**
 * Hook to fetch available food menu items.
 *
 * @returns {object} Query result with foodItems array and loading state
 */
export function useFoodItems() {
  const query = useQuery({
    queryKey: queryKeys.orders.foodItems(),
    queryFn: async () => {
      return ordersApi.getFoodItems();
    },
  });

  return {
    ...query,
    foodItems: query.data || [],
    isLoading: query.isLoading,
  };
}

/**
 * Mutation hook to create a new desk order and optimistically update the orders cache.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult} Mutation instance
 */
export function useCreateDeskOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roomId, items }) =>
      ordersApi.createDeskOrder({ roomId, items }),
    onSuccess: (createdOrder) => {
      const normalized = normalizeFoodOrder(createdOrder);
      queryClient.setQueryData(queryKeys.orders.staff(), (oldData = []) => {
        return upsert(oldData, normalized);
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
}

/**
 * Mutation hook to update an order's status and sync cache state.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult} Mutation instance
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }) => {
      const backendStatus = UI_TO_ORDER_STATUS[status] || status;
      return ordersApi.updateOrderStatusApi(orderId, backendStatus);
    },
    onSuccess: (updatedOrder) => {
      const normalized = normalizeFoodOrder(updatedOrder);
      queryClient.setQueryData(queryKeys.orders.staff(), (oldData = []) => {
        return upsert(oldData, normalized);
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
}
