import jwt from "jsonwebtoken";
import User from "#/modules/users/models/User.js";
import Booking from "#/modules/bookings/models/Booking.js";
import KioskDevice from "#/modules/kiosks/models/KioskDevice.js";
import { CURRENT_STAY_STATUSES } from "#/modules/bookings/constants.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === "KIOSK") {
      const kiosk = await KioskDevice.findById(decoded.kioskId);

      if (!kiosk || !kiosk.isActive || kiosk.status === "DISABLED") {
        return res.status(401).json({
          success: false,
          message: "Kiosk terminal is not authorized or has been disabled",
        });
      }

      req.kiosk = kiosk;
      req.user = {
        _id: kiosk._id,
        role: "KIOSK",
        hotelId: kiosk.hotelId,
        deviceId: kiosk.deviceId,
        name: kiosk.name,
      };

      return next();
    }

    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User is not authorized",
      });
    }

    req.user = user;

    // Attach the guest's active stay so stay-scoped fields (room, DND) can be
    // resolved from the Booking model instead of denormalized onto User.
    if (user.role === "GUEST") {
      req.currentBooking = await Booking.findOne({
        guestId: user._id,
        status: { $in: CURRENT_STAY_STATUSES },
      }).sort({ createdAt: -1 });
    }

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
