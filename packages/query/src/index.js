export { createQueryClient } from "./queryClient.js";
export { QueryProvider } from "./QueryProvider.jsx";
export { queryKeys } from "./keys.js";
export {
  upsertItemInList,
  removeItemFromList,
  updateItemInList,
} from "./helpers.js";

// Re-export core TanStack Query hooks so consuming apps have a unified import
export {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
