import jwt from "jsonwebtoken";
import User from "#/modules/users/models/User.js";
import KioskDevice from "#/modules/kiosks/models/KioskDevice.js";

export const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === "KIOSK") {
      const kiosk = await KioskDevice.findById(decoded.kioskId);

      if (!kiosk || !kiosk.isActive) {
        return next(new Error("Kiosk terminal is not authorized"));
      }

      socket.data.kioskId = kiosk._id.toString();
      socket.data.deviceId = kiosk.deviceId;
      socket.data.role = "KIOSK";
      socket.data.hotelId = kiosk.hotelId.toString();

      socket.join(`hotel:${kiosk.hotelId}`);
      socket.join(`kiosk:${kiosk._id}`);
      socket.join(`device:${kiosk.deviceId}`);

      return next();
    }

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
