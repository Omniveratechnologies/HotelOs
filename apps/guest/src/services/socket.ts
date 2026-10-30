import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "@/config/api";
import { getStoredToken } from "@/services/apiClient";
import type { Order, ServiceRequest } from "@/types/guest-dashboard";

type GuestSocketHandlers = {
  onOrderCreated?: (order: Order) => void;
  onOrderUpdated?: (order: Order) => void;
  onRequestCreated?: (request: ServiceRequest) => void;
  onRequestUpdated?: (request: ServiceRequest) => void;
  onDndUpdated?: (dndEnabled: boolean) => void;
  onStayStatusUpdated?: (data: { status: string; roomId?: string }) => void;
  onKioskGuestCheckedIn?: (data: unknown) => void;
  onKioskGuestCheckedOut?: (data: unknown) => void;
};

function getSocketUrl() {
  return API_BASE_URL.replace(/\/api\/v1\/?$/, "");
}

/**
 * Connect an authenticated guest socket. The backend derives the guest's
 * identity from the handshake JWT and automatically joins the socket to
 * `guest:<userId>` and device/room channels.
 */
export function connectGuestSocket(
  handlers: GuestSocketHandlers,
  customToken?: string,
): Socket {
  const token = customToken || getStoredToken();
  const socket = io(getSocketUrl(), {
    auth: { token },
    transports: ["websocket", "polling"],
    autoConnect: false,
  });

  if (handlers.onOrderCreated) {
    socket.on("order:created", handlers.onOrderCreated);
  }
  if (handlers.onOrderUpdated) {
    socket.on("order:updated", handlers.onOrderUpdated);
  }
  if (handlers.onRequestCreated) {
    socket.on("serviceRequest:created", handlers.onRequestCreated);
  }
  if (handlers.onRequestUpdated) {
    socket.on("serviceRequest:updated", handlers.onRequestUpdated);
  }
  if (handlers.onDndUpdated) {
    socket.on("dnd:updated", (data: { dndEnabled: boolean }) => {
      handlers.onDndUpdated?.(data.dndEnabled);
    });
  }
  if (handlers.onStayStatusUpdated) {
    socket.on("stay:status-updated", handlers.onStayStatusUpdated);
  }
  if (handlers.onKioskGuestCheckedIn) {
    socket.on("kiosk:guest-checked-in", handlers.onKioskGuestCheckedIn);
  }
  if (handlers.onKioskGuestCheckedOut) {
    socket.on("kiosk:guest-checked-out", handlers.onKioskGuestCheckedOut);
  }

  socket.connect();

  return socket;
}

export function disconnectGuestSocket(socket: Socket | null) {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }
}
