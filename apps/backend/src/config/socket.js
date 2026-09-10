import { Server } from "socket.io";

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: "*" }, // tighten to CLIENT_URL in production
  });

  io.on("connection", (socket) => {
    // Guests join a room-scoped channel so updates target only them.
    socket.on("join:guest", (guestId) => {
      socket.join(`guest:${guestId}`);
    });
    socket.on("join:hotel", (hotelId) => {
      socket.join(`hotel:${hotelId}`);
    });
  });

  return io;
}

export function getIo() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
