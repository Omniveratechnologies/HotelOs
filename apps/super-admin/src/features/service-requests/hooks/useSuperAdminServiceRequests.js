import {
  useQuery,
  useMutation,
  useQueryClient,
  queryKeys,
} from "@hotelos/query";
import { mockServiceRequests } from "../../../data/mockData.js";

/**
 * Hook to fetch all service requests for super-admin.
 * @returns {object} Query result with serviceRequests array, isLoading, and error.
 */
export function useSuperAdminServiceRequests() {
  const query = useQuery({
    queryKey: queryKeys.requests.list(),
    queryFn: async () => {
      return [...mockServiceRequests];
    },
  });

  return {
    ...query,
    serviceRequests: query.data || [],
    isLoading: query.isLoading,
    error: query.error
      ? query.error.message || "Failed to load requests"
      : null,
  };
}

/**
 * Mutation hook to update the status of a service request.
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useUpdateSuperAdminServiceRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, status }) => {
      const request = mockServiceRequests.find((item) => item.id === requestId);
      if (request) {
        request.status = status;
      }
      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
    },
  });
}
