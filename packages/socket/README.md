# @hotelos/socket

The shared WebSocket client and real-time state synchronization package for HotelOS, connecting frontends to the backend Socket.IO hub.

It manages socket lifecycles (singleton connection, reconnects, authentication) and automatically synchronizes incoming real-time events with the TanStack Query cache.

- Package name: `@hotelos/socket`
- Dependency: `socket.io-client` `^4`, `@hotelos/query`, `@hotelos/utils`

---

## Exports

| Export                                          | Description                                                                                                 |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `getSocket(url?, token?)`                       | Returns the singleton Socket.IO connection instance, initializing or authenticating with JWT if needed      |
| `disconnectSocket()`                            | Disconnects the socket and resets singleton state                                                           |
| `bindSocketToQueryClient(queryClient, options)` | Attaches socket listeners (`order:*`, `serviceRequest:*`) that mutate/invalidate query caches automatically |
| `useRealtimeSync(queryClient, options)`         | React hook managing the lifecycle of `bindSocketToQueryClient`                                              |

---

## Realtime Event Synchronization

The backend Socket.IO server authenticates connections with `{ auth: { token } }` and joins staff sockets to their hotel room.

`bindSocketToQueryClient` intercepts live events:

- **`connect` / reconnect:** Invalidates orders, service requests, and dashboard stats to catch any missed offline events.
- **`order:created` / `order:updated`:** Upserts the normalized order into `queryKeys.orders.staff()` cache and refreshes dashboard stats.
- **`serviceRequest:created` / `serviceRequest:updated`:** Upserts the normalized request into `queryKeys.requests.staff()` cache and refreshes dashboard stats.

---

## Usage in App Providers

Consuming apps mount `<RealtimeSubscriber />` inside `AppProviders.jsx`:

```jsx
import { useQueryClient } from "@hotelos/query";
import { useRealtimeSync } from "@hotelos/socket";
import { getStoredToken } from "@hotelos/api";

function RealtimeSubscriber() {
  const queryClient = useQueryClient();
  const token = getStoredToken();

  useRealtimeSync(queryClient, { token });

  return null;
}
```
