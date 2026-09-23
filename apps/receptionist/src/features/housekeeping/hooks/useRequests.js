import {
  useQuery,
  useMutation,
  useQueryClient,
  queryKeys,
} from "@hotelos/query";
import { serviceRequestsApi } from "@hotelos/api";
import { normalizeRequest, upsert } from "@hotelos/utils";

/**
 * Hook to fetch and normalize service/housekeeping requests for hotel staff.
 *
 * @returns {object} Query result with serviceRequests array and loading/error states
 */
export function useRequests() {
  const query = useQuery({
    queryKey: queryKeys.requests.staff(),
    queryFn: async () => {
      const data = await serviceRequestsApi.getStaffRequests();
      return (data || []).map(normalizeRequest);
    },
  });

  return {
    ...query,
    serviceRequests: query.data || [],
    isLoading: query.isLoading,
    error: query.error
      ? query.error.message || "Failed to load service requests"
      : null,
  };
}

/**
 * Mutation hook to create a new housekeeping or maintenance request from the desk.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useCreateDeskRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roomId, type, description, items, priority }) =>
      serviceRequestsApi.createDeskRequest({
        roomId,
        type,
        description,
        items,
        priority: priority || "normal",
      }),
    onSuccess: (createdRequest) => {
      const normalized = normalizeRequest(createdRequest);
      queryClient.setQueryData(queryKeys.requests.staff(), (oldData = []) => {
        return upsert(oldData, normalized);
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
}

/**
 * Mutation hook to transition a service request to ACKNOWLEDGED status.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useAcknowledgeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId) =>
      serviceRequestsApi.updateRequestStatusApi(requestId, "ACKNOWLEDGED"),
    onSuccess: (updatedRequest) => {
      const normalized = normalizeRequest(updatedRequest);
      queryClient.setQueryData(queryKeys.requests.staff(), (oldData = []) => {
        return upsert(oldData, normalized);
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
}

/**
 * Mutation hook to transition a service request to COMPLETED status.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useCompleteRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId) =>
      serviceRequestsApi.updateRequestStatusApi(requestId, "COMPLETED"),
    onSuccess: (updatedRequest) => {
      const normalized = normalizeRequest(updatedRequest);
      queryClient.setQueryData(queryKeys.requests.staff(), (oldData = []) => {
        return upsert(oldData, normalized);
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
}
