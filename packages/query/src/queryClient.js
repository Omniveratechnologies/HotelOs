import { QueryClient } from "@tanstack/react-query";

/**
 * Creates and configures a standard TanStack QueryClient instance with production defaults.
 *
 * @param {object} [overrides={}] - Optional query/mutation option overrides
 * @returns {QueryClient} Configured QueryClient instance
 */
export function createQueryClient(overrides = {}) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes (garbage collection / cache time)
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        ...overrides?.queries,
      },
      mutations: {
        retry: 0,
        ...overrides?.mutations,
      },
    },
  });
}
