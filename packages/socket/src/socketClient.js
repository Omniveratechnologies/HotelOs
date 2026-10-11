import { io } from "socket.io-client";

let socket = null;

const getDefaultApiUrl = () => {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return "http://localhost:5001";
};

const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
};

/**
 * Returns the singleton Socket.IO client instance, initializing it if not already connected.
 *
 * @param {string} [url] - Socket server endpoint URL
 * @param {string|null} [token] - Optional authentication token
 * @returns {import("socket.io-client").Socket} Connected socket client instance
 */
export function getSocket(url = getDefaultApiUrl(), token = getAuthToken()) {
  if (socket) return socket;

  socket = io(url, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  return socket;
}

/**
 * Disconnects and cleans up the active Socket.IO client instance.
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
