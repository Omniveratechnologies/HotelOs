# @hotelos/query

The centralized data fetching and cache management package for HotelOS frontends, built on **TanStack Query v5** (`@tanstack/react-query`).

It provides a configured `QueryClient`, a unified `QueryProvider`, standard query key factory (`queryKeys`), cache mutation helpers, and re-exports core TanStack Query hooks so apps maintain a consistent data layer.

- Package name: `@hotelos/query`
- Dependency: `@tanstack/react-query` `^5`

---

## Exports

| Export                                                                         | Description                                                                             |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `createQueryClient(options?)`                                                  | Factory creating a configured `QueryClient` (default staleTime: 60s, gcTime: 5m, retry) |
| `QueryProvider`                                                                | React provider wrapping applications with `QueryClientProvider`                         |
| `queryKeys`                                                                    | Centralized query key factory for predictable cache invalidation                        |
| `upsertItemInList(list, item, key?)`, `updateItemInList`, `removeItemInList`   | Pure array helpers for optimistic updates and cache transforms                          |
| `useQuery`, `useMutation`, `useQueryClient`, `useInfiniteQuery`, `QueryClient` | Re-exported directly from `@tanstack/react-query`                                       |

---

## Setup in an App

Wrap your root application in `QueryProvider`:

```jsx
// src/app/AppProviders.jsx
import { QueryProvider } from "@hotelos/query";

export function AppProviders({ children }) {
  return <QueryProvider>{children}</QueryProvider>;
}
```

---

## Query Keys Factory (`queryKeys`)

All queries and mutations must reference `queryKeys` to ensure safe, structured cache invalidation:

```js
import { queryKeys } from "@hotelos/query";

// Example keys:
queryKeys.rooms.list(); // ['rooms', 'list', {}]
queryKeys.rooms.detail(roomId); // ['rooms', 'detail', roomId]
queryKeys.guests.list("checked-in"); // ['guests', 'list', 'checked-in']
queryKeys.hotels.liveRates(params); // ['hotels', 'live-rates', params]
queryKeys.hotels.channelApprovals(filts); // ['hotels', 'channel-approvals', filts]
queryKeys.ratePlans.list(); // ['rate-plans', 'list', {}]
queryKeys.roomTypes.list(); // ['room-types', 'list', {}]
```

---

## Example Usage: Custom Feature Hook

```js
import {
  useQuery,
  useMutation,
  useQueryClient,
  queryKeys,
} from "@hotelos/query";
import { getRooms, createRoom } from "@hotelos/api";

export function useRooms(filters) {
  return useQuery({
    queryKey: queryKeys.rooms.list(filters),
    queryFn: () => getRooms(filters),
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => createRoom(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.lists() });
    },
  });
}
```
