import { Server } from "socket.io";
import { socketAuth } from "#/shared/middleware/socket-auth.middleware.js";
import KioskDevice from "#/modules/kiosks/models/KioskDevice.js";

let io;

// Allow a comma-separated list of frontend origins (e.g.
// SOCKET_CORS_ORIGINS=http://localhost:5175,http://localhost:5177). Falls
// back to reflecting the request origin so local dev and LAN clients work.
function resolveOrigins() {
  const origins = process.env.SOCKET_CORS_ORIGINS;
  if (!origins || origins.trim() === "*") return true;
  const allowedOrigins = new Set(
    origins.split(",").map((origin) => origin.trim()),
  );
  return (origin, callback) => {
    // Allow non-browser clients (e.g. Expo / React Native Android kiosk)
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, true);
    return callback(null, true);
  };
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

    // When a kiosk connects, immediately push its latest database configuration/status
    // so any changes made while the device was offline are applied in real time
    if (role === "KIOSK" && socket.data.kioskId) {
      KioskDevice.findById(socket.data.kioskId)
        .lean()
        .then((kiosk) => {
          if (kiosk) {
            socket.emit("device:config-updated", {
              status: kiosk.status,
              targetDashboard: kiosk.targetDashboard,
              assignedUrl: kiosk.assignedUrl,
            });
          }
        })
        .catch((err) => {
          console.warn(
            "[socket] Failed to push initial config to connected kiosk:",
            err?.message,
          );
        });
    }
  });

  return io;
}

export function getIo() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
