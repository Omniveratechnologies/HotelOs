import { io } from "socket.io-client";
import { getStoredToken } from "./auth.service.js";

let socket = null;

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

// Lazily create a single authenticated socket. The backend joins the socket to
// the user's hotel room, so both this page and any other open receptionist tab
// receive the same live order / service-request events.
function getSocket() {
  if (socket) return socket;

  socket = io(API_URL, {
    auth: { token: getStoredToken() },
    transports: ["websocket", "polling"],
    reconnection: true,
  });

  return socket;
}

// callbacks: { order: (data) => void, serviceRequest: (data) => void }
export function subscribeRealtime(callbacks = {}) {
  const client = getSocket();

  let orderListener = null;
  let serviceRequestListener = null;

  if (callbacks.onConnect) {
    client.on("connect", callbacks.onConnect);
  }

  if (callbacks.order) {
    orderListener = (data) => callbacks.order(data);
    client.on("order:created", orderListener);
    client.on("order:updated", orderListener);
  }

  if (callbacks.serviceRequest) {
    serviceRequestListener = (data) => callbacks.serviceRequest(data);
    client.on("serviceRequest:created", serviceRequestListener);
    client.on("serviceRequest:updated", serviceRequestListener);
  }

  return () => {
    if (callbacks.onConnect) {
      client.off("connect", callbacks.onConnect);
    }

    if (orderListener) {
      client.off("order:created", orderListener);
      client.off("order:updated", orderListener);
    }

    if (serviceRequestListener) {
      client.off("serviceRequest:created", serviceRequestListener);
      client.off("serviceRequest:updated", serviceRequestListener);
    }

    // A single authenticated consumer (the app providers) owns the socket, so
    // tearing it down on unmount guarantees a re-login starts a fresh session.
    disconnectRealtime();
  };
}

export function disconnectRealtime() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
