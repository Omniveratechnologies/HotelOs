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
 * Connect an authenticated guest or kiosk socket.
 * - When logged in as a guest: uses the signed guest JWT from localStorage.
 * - When in kiosk standby mode (room vacant): falls back to `kiosk_standby_token` from sessionStorage
 *   so the in-room tablet joins room:* and device:* channels to receive check-in socket events in real time.
 */
export function connectGuestSocket(
  handlers: GuestSocketHandlers,
  customToken?: string,
): Socket {
  const token =
    customToken ||
    getStoredToken() ||
    (typeof window !== "undefined"
      ? sessionStorage.getItem("kiosk_standby_token")
      : null);
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
