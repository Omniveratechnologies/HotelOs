import { Server } from "socket.io";
import { socketAuth } from "#/shared/middleware/socket-auth.middleware.js";

let io;

// Allow a comma-separated list of frontend origins (e.g.
// SOCKET_CORS_ORIGINS=http://localhost:5175,http://localhost:5177). Falls
// back to reflecting the request origin so local dev just works.
function resolveOrigins() {
  const origins = process.env.SOCKET_CORS_ORIGINS;
  if (!origins) return true;
  return origins.split(",").map((origin) => origin.trim());
}

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: resolveOrigins(),
      credentials: true,
    },
  });

  io.use(socketAuth);

  io.on("connection", (socket) => {
    const { userId, role, hotelId } = socket.data;

    if (role !== "GUEST" && hotelId) {
      socket.join(`hotel:${hotelId}`);
    }

    if (role === "GUEST" && userId) {
      socket.join(`guest:${userId}`);
    }
  });

  return io;
}

export function getIo() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
