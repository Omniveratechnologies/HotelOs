import jwt from "jsonwebtoken";
import { env } from "#/config/env.js";

export const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      hotelId: user.hotelId,
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
    },
  );
};

export const generateKioskToken = (kiosk) => {
  return jwt.sign(
    {
      kioskId: kiosk._id,
      deviceId: kiosk.deviceId,
      hotelId: kiosk.hotelId,
      role: "KIOSK",
    },
    env.jwtSecret,
    {
      expiresIn: "365d",
    },
  );
};
