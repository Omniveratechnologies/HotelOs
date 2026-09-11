import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "@/config/api";
import type { Order, ServiceRequest } from "@/types/guest-dashboard";

type GuestSocketHandlers = {
  onOrderUpdate: (order: Order) => void;
  onRequestUpdate: (request: ServiceRequest) => void;
};

function getSocketUrl() {
  return API_BASE_URL.replace(/\/api\/v1\/?$/, "");
}

export function connectGuestSocket(
  guestId: string,
  handlers: GuestSocketHandlers,
): Socket {
  const socket = io(getSocketUrl(), {
    autoConnect: false,
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    socket.emit("join:guest", guestId);
  });
  socket.on("order:update", handlers.onOrderUpdate);
  socket.on("request:update", handlers.onRequestUpdate);
  socket.connect();

  return socket;
}
