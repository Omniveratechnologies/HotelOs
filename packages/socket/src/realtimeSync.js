import { useEffect } from "react";
import { queryKeys } from "@hotelos/query";
import { normalizeFoodOrder, normalizeRequest, upsert } from "@hotelos/utils";
import { getSocket } from "./socketClient.js";

/**
 * Attaches real-time Socket.IO event listeners that update the TanStack Query cache directly.
 *
 * @param {import("@tanstack/react-query").QueryClient} queryClient - QueryClient instance
 * @param {object} [options={}] - Connection and callback options
 * @param {string} [options.url] - Socket server endpoint URL
 * @param {string} [options.token] - Authentication token
 * @param {Function} [options.onConnect] - Invoked upon socket connection or reconnection
 * @param {Function} [options.onOrder] - Callback invoked when an order event arrives
 * @param {Function} [options.onServiceRequest] - Callback invoked when a service request event arrives
 * @returns {Function} Teardown function to unsubscribe socket listeners
 */
export function bindSocketToQueryClient(queryClient, options = {}) {
  const socket = getSocket(options.url, options.token);

  const handleConnect = () => {
    // When connected or reconnected, invalidate queries so no events emitted
    // while disconnected are missed.
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.staff() });
    queryClient.invalidateQueries({ queryKey: queryKeys.requests.staff() });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });

    if (options.onConnect) {
      options.onConnect();
    }
  };

  const handleOrder = (data) => {
    const normalized = normalizeFoodOrder(data);
    queryClient.setQueryData(queryKeys.orders.staff(), (oldData = []) => {
      return upsert(oldData, normalized);
    });
    // Invalidate dashboard stats to keep badge / metrics fresh
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });

    if (options.onOrder) {
      options.onOrder(normalized);
    }
  };

  const handleServiceRequest = (data) => {
    const normalized = normalizeRequest(data);
    queryClient.setQueryData(queryKeys.requests.staff(), (oldData = []) => {
      return upsert(oldData, normalized);
    });
    // Invalidate dashboard stats to keep badge / metrics fresh
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });

    if (options.onServiceRequest) {
      options.onServiceRequest(normalized);
    }
  };

  socket.on("connect", handleConnect);
  socket.on("order:created", handleOrder);
  socket.on("order:updated", handleOrder);
  socket.on("serviceRequest:created", handleServiceRequest);
  socket.on("serviceRequest:updated", handleServiceRequest);

  return () => {
    socket.off("connect", handleConnect);
    socket.off("order:created", handleOrder);
    socket.off("order:updated", handleOrder);
    socket.off("serviceRequest:created", handleServiceRequest);
    socket.off("serviceRequest:updated", handleServiceRequest);
  };
}

/**
 * React hook that mounts real-time socket synchronization for query cache during component lifecycle.
 *
 * @param {import("@tanstack/react-query").QueryClient} queryClient - QueryClient instance
 * @param {object} [options={}] - Configuration options for socket connection and handlers
 */
export function useRealtimeSync(queryClient, options = {}) {
  const { url, token, onConnect, onOrder, onServiceRequest } = options;

  useEffect(() => {
    if (!queryClient) return;

    const cleanup = bindSocketToQueryClient(queryClient, {
      url,
      token,
      onConnect,
      onOrder,
      onServiceRequest,
    });

    return () => {
      cleanup();
    };
  }, [queryClient, url, token, onConnect, onOrder, onServiceRequest]);
}
