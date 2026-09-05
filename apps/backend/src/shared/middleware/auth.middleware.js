import jwt from "jsonwebtoken";
import User from "#/modules/users/models/User.js";
import Booking from "#/modules/bookings/models/Booking.js";

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
        status: { $in: ["reserved", "checked-in"] },
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
