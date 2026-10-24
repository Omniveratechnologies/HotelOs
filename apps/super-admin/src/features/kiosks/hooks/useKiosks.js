import {
  useQuery,
  useMutation,
  useQueryClient,
  queryKeys,
} from "@hotelos/query";
import { kioskDevicesApi } from "@hotelos/api";

/**
 * Fetch all kiosks with optional filters (hotelId, status, q)
 */
export function useKiosks(filters = {}) {
  const query = useQuery({
    queryKey: queryKeys.kiosks.list(filters),
    queryFn: async () => {
      const data = await kioskDevicesApi.getKioskDevices(filters);
      return data || { devices: [], stats: {} };
    },
    refetchInterval: 10000,
  });

  return {
    ...query,
    devices: query.data?.devices || [],
    stats: query.data?.stats || {
      total: 0,
      online: 0,
      offline: 0,
      maintenance: 0,
      disabled: 0,
    },
    isLoading: query.isLoading,
    error: query.error ? query.error.message || "Failed to load kiosks" : null,
  };
}

/**
 * Fetch available backend-configured dashboard presets
 */
export function useKioskDashboards() {
  const query = useQuery({
    queryKey: queryKeys.kiosks.dashboards(),
    queryFn: async () => {
      const data = await kioskDevicesApi.getKioskDashboards();
      return data || [];
    },
  });

  return {
    ...query,
    dashboards: query.data || [],
    isLoading: query.isLoading,
  };
}

/**
 * Register a new kiosk terminal
 */
export function useCreateKiosk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => kioskDevicesApi.createKioskDevice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kiosks.all });
    },
  });
}

/**
 * Update kiosk terminal settings, reassign hotel, or change dashboard mode
 */
export function useUpdateKiosk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => kioskDevicesApi.updateKioskDevice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kiosks.all });
    },
  });
}

/**
 * Regenerate terminal pairing code
 */
export function useRegeneratePairCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => kioskDevicesApi.regenerateKioskPairCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kiosks.all });
    },
  });
}

/**
 * Dispatch remote control command to a terminal
 */
export function useSendKioskCommand() {
  return useMutation({
    mutationFn: ({ id, command, payload }) =>
      kioskDevicesApi.sendKioskCommand(id, { command, payload }),
  });
}

/**
 * Delete a kiosk terminal
 */
export function useDeleteKiosk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => kioskDevicesApi.deleteKioskDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kiosks.all });
    },
  });
}
