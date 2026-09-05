import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "#/modules/users/models/User.js";

let io = null;

// Join an authenticated socket to its hotel's live room. A socket may belong to
// multiple hotels (e.g. a SUPER_ADMIN) but staff apps only consume their own
// hotel's events, so we subscribe to every hotel the user is part of.
function joinHotelRooms(socket, userId) {
  return async () => {
    const user = await User.findById(userId).select("hotelId role");

    if (!user?.hotelId) return;

    socket.join(`hotel:${user.hotelId.toString()}`);
    socket.data.hotelId = user.hotelId.toString();
  };
}

export function initRealtime(server) {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.userId);

      if (!user || !user.isActive) {
        return next(new Error("User is not authorized"));
      }

      socket.data.userId = user._id.toString();
      socket.data.role = user.role;

      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    joinHotelRooms(socket, socket.data.userId)();
  });

  return io;
}

export function getIo() {
  return io;
}

export function emitToHotel(hotelId, event, payload) {
  if (!io || !hotelId) return;

  io.to(`hotel:${hotelId.toString()}`).emit(event, payload);
}
