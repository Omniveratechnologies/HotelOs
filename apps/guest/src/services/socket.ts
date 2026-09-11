import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "@/config/api";
import { getStoredToken } from "@/services/apiClient";
import type { Order, ServiceRequest } from "@/types/guest-dashboard";

type GuestSocketHandlers = {
  onOrderCreated: (order: Order) => void;
  onOrderUpdated: (order: Order) => void;
  onRequestCreated: (request: ServiceRequest) => void;
  onRequestUpdated: (request: ServiceRequest) => void;
};

function getSocketUrl() {
  return API_BASE_URL.replace(/\/api\/v1\/?$/, "");
}

/**
 * Connect an authenticated guest socket. The backend derives the guest's
 * identity from the handshake JWT and automatically joins the socket to
 * `guest:<userId>` — no client-emitted `join:*` events are needed.
 *
 * Listens to the four documented realtime events:
 *   order:created, order:updated,
 *   serviceRequest:created, serviceRequest:updated
 */
export function connectGuestSocket(handlers: GuestSocketHandlers): Socket {
  const socket = io(getSocketUrl(), {
    auth: { token: getStoredToken() },
    transports: ["websocket", "polling"],
    autoConnect: false,
  });

  socket.on("order:created", handlers.onOrderCreated);
  socket.on("order:updated", handlers.onOrderUpdated);
  socket.on("serviceRequest:created", handlers.onRequestCreated);
  socket.on("serviceRequest:updated", handlers.onRequestUpdated);

  socket.connect();

  return socket;
}

export function disconnectGuestSocket(socket: Socket | null) {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }
}
