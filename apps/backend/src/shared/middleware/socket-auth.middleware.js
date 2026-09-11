import jwt from "jsonwebtoken";
import User from "#/modules/users/models/User.js";

export const socketAuth = async (socket, next) => {
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

    if (user.hotelId) {
      socket.data.hotelId = user.hotelId.toString();
    }

    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
};
