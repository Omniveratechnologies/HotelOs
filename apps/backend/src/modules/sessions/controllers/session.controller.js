import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import {
  calculateDistanceMeters,
  SESSION_ERROR_CODES,
  SESSION_POLICIES,
} from "@hotelos/utils";
// Explicitly register User schema so that cross-collection .populate("guestId")
// queries succeed without requiring prior route execution.
import "#/modules/users/models/User.js";
import Hotel from "#/modules/hotels/models/Hotel.js";
import Table from "#/modules/tables/models/Table.js";
import Room from "#/modules/rooms/models/Room.js";
import Booking from "#/modules/bookings/models/Booking.js";
import KioskDevice from "#/modules/kiosks/models/KioskDevice.js";
import Session from "../models/Session.js";
import KioskHandoff from "../models/KioskHandoff.js";
import logger from "#/utils/logger.js";

const EIGHT_HOURS_MS =
  SESSION_POLICIES.ABSOLUTE_LIFETIME_HOURS * 60 * 60 * 1000;

function setSessionCookie(res, rawToken) {
  res.cookie("hotelos_session", rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: EIGHT_HOURS_MS,
    path: "/",
  });
}

function clearSessionCookie(res) {
  res.clearCookie("hotelos_session", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Creates an authenticated guest session from a scanned table QR code.
 * Requires initial physical presence verification via client coordinates.
 */
export const createQrGuestSession = async (req, res) => {
  try {
    const { hotelId, tableId, latitude, longitude, accuracy } = req.body;

    if (!hotelId || !tableId) {
      return res.status(400).json({
        success: false,
        code: SESSION_ERROR_CODES.SESSION_INVALID,
        message: "hotelId and tableId are required to create a table session",
      });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel || hotel.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        code: SESSION_ERROR_CODES.HOTEL_INACTIVE,
        message: "Hotel service is currently unavailable",
      });
    }

    const table = await Table.findOne({ _id: tableId, hotelId });
    if (
      !table ||
      table.status === "DISABLED" ||
      table.isOrderingEnabled === false
    ) {
      return res.status(403).json({
        success: false,
        code: SESSION_ERROR_CODES.TABLE_NOT_ORDERABLE,
        message: "Ordering for this table is currently unavailable",
      });
    }

    // Verify initial client location coordinates
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const acc = parseFloat(accuracy);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({
        success: false,
        code: SESSION_ERROR_CODES.LOCATION_REQUIRED,
        message:
          "Location coordinates (latitude and longitude) are required to verify presence at this table",
      });
    }

    const maxAccuracy =
      hotel.locationSettings?.maxAccuracyMeters ??
      SESSION_POLICIES.MAX_ACCURACY_METERS;

    if (!Number.isNaN(acc) && acc > maxAccuracy) {
      return res.status(400).json({
        success: false,
        code: SESSION_ERROR_CODES.LOCATION_INACCURATE,
        message: `Reported location accuracy (±${Math.round(acc)}m) exceeds maximum permitted threshold (±${maxAccuracy}m). Please wait for a better GPS/Wi-Fi fix.`,
      });
    }

    const hasTableCoords =
      table.coordinates &&
      typeof table.coordinates.latitude === "number" &&
      typeof table.coordinates.longitude === "number";

    const hasHotelCoords =
      hotel.coordinates &&
      typeof hotel.coordinates.latitude === "number" &&
      typeof hotel.coordinates.longitude === "number";

    if (!hasTableCoords && !hasHotelCoords) {
      if (hotel.locationSettings?.isLocationVerificationRequired === false) {
        logger.warn(
          { hotelId: hotel._id },
          "Session created without coordinates verification because hotel coordinates are not configured",
        );
      } else {
        return res.status(403).json({
          success: false,
          code: SESSION_ERROR_CODES.LOCATION_UNAVAILABLE,
          message:
            "Hotel coordinates have not been configured by administration. Please ask staff for assistance.",
        });
      }
    } else {
      const target = hasTableCoords ? table.coordinates : hotel.coordinates;
      const radius = hasTableCoords
        ? (hotel.locationSettings?.tableRadiusMeters ??
          SESSION_POLICIES.DEFAULT_TABLE_RADIUS_METERS)
        : (hotel.locationSettings?.hotelRadiusMeters ??
          SESSION_POLICIES.DEFAULT_HOTEL_RADIUS_METERS);

      const distance = calculateDistanceMeters(
        lat,
        lon,
        target.latitude,
        target.longitude,
      );

      if (distance > radius) {
        return res.status(403).json({
          success: false,
          code: SESSION_ERROR_CODES.LOCATION_OUTSIDE_RADIUS,
          message: `Your location (${Math.round(distance)}m away) is outside the permitted dining radius (${radius}m).`,
        });
      }
    }

    // Generate cryptographic opaque session token and CSRF token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const csrfToken = crypto.randomBytes(24).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const expiresAt = new Date(Date.now() + EIGHT_HOURS_MS);

    const session = await Session.create({
      tokenHash,
      type: "QR_GUEST",
      hotelId: hotel._id,
      tableId: table._id,
      tableSessionGeneration: table.sessionGeneration || 1,
      status: "ACTIVE",
      expiresAt,
      csrfToken,
      lastActivityAt: new Date(),
    });

    setSessionCookie(res, rawToken);

    return res.status(201).json({
      success: true,
      message: "Guest table session established successfully",
      data: {
        token: rawToken,
        csrfToken,
        sessionType: "QR_GUEST",
        hotelId: hotel._id,
        tableId: table._id,
        tableNumber: table.tableNumber,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    logger.error(error, "Create QR Guest Session Error");
    return res.status(500).json({
      success: false,
      message: "Failed to establish guest session",
    });
  }
};

/**
 * Exchanges a single-use 60-second kiosk handoff code for a Kiosk session token.
 * Used exclusively by the dashboard web application loaded inside the Kiosk WebView.
 */
export const exchangeKioskHandoff = async (req, res) => {
  try {
    const { handoffCode } = req.body;

    if (
      !handoffCode ||
      typeof handoffCode !== "string" ||
      !handoffCode.trim()
    ) {
      return res.status(400).json({
        success: false,
        code: SESSION_ERROR_CODES.INVALID_OR_EXPIRED_HANDOFF_CODE,
        message: "Single-use handoff code is required",
      });
    }

    const codeHash = crypto
      .createHash("sha256")
      .update(handoffCode.trim())
      .digest("hex");

    // Atomically find and consume the single-use code
    const handoff = await KioskHandoff.findOneAndUpdate(
      {
        codeHash,
        consumed: false,
        expiresAt: { $gt: new Date() },
      },
      {
        $set: {
          consumed: true,
          consumedAt: new Date(),
        },
      },
      { new: true },
    );

    if (!handoff) {
      return res.status(401).json({
        success: false,
        code: SESSION_ERROR_CODES.INVALID_OR_EXPIRED_HANDOFF_CODE,
        message:
          "The handoff code is invalid, already consumed, or has expired",
      });
    }

    // Verify kiosk device status
    const kiosk = await KioskDevice.findById(handoff.kioskId);
    if (
      !kiosk ||
      !kiosk.isActive ||
      kiosk.status === "DISABLED" ||
      !kiosk.isPaired
    ) {
      return res.status(401).json({
        success: false,
        code: SESSION_ERROR_CODES.KIOSK_UNAUTHORIZED,
        message: "Kiosk terminal is deactivated, disabled, or unpaired",
      });
    }

    const targetRoomId = handoff.roomId || kiosk.roomId || null;
    let activeBooking = null;
    let roomDoc = null;
    let hotelDoc = null;

    try {
      hotelDoc = await Hotel.findById(handoff.hotelId).select(
        "name wifiNetworkName wifiPassword",
      );
    } catch {
      // ignore
    }

    if (targetRoomId) {
      try {
        roomDoc = await Room.findById(targetRoomId).select(
          "roomNumber type floor status",
        );
      } catch {
        // ignore
      }
      try {
        // Look up the most recent active checked-in booking for this room.
        // Explicitly sorting by createdAt: -1 ensures that in case of any duplicate
        // records, the newest valid check-in is prioritized instead of natural order scan.
        activeBooking = await Booking.findOne({
          hotelId: handoff.hotelId,
          roomId: targetRoomId,
          status: "checked-in",
        })
          .sort({ createdAt: -1 })
          .populate("guestId", "name email phone username isActive role");
      } catch (bookingLookupErr) {
        logger.warn(
          bookingLookupErr,
          "Failed to resolve active booking during kiosk handoff exchange",
        );
      }
    }

    let guestToken = null;
    let guestUser = null;
    let activeStay = false;
    let standbyToken = null;

    if (
      activeBooking &&
      activeBooking.guestId &&
      activeBooking.guestId.isActive !== false
    ) {
      activeStay = true;
      guestUser = {
        id: activeBooking.guestId._id,
        name: activeBooking.guestId.name,
        username: activeBooking.guestId.username,
        role: "GUEST",
        hotelId: handoff.hotelId,
        roomId: targetRoomId,
        mustChangePassword: false,
      };

      // Generate guest JWT so guest app apiClient can make authenticated calls
      guestToken = jwt.sign(
        {
          userId: activeBooking.guestId._id,
          role: "GUEST",
          hotelId: handoff.hotelId,
          roomId: targetRoomId,
          kioskId: kiosk._id,
        },
        process.env.JWT_SECRET || "default_jwt_secret",
        { expiresIn: "8h" },
      );
    } else {
      // Standby Mode: Room is vacant or guest has not checked in yet.
      // Issue a signed KIOSK device token so the tablet can maintain an authenticated
      // Socket.IO connection to device:* and room:* channels while displaying the standby screen.
      standbyToken = jwt.sign(
        {
          role: "KIOSK",
          kioskId: kiosk._id,
          deviceId: kiosk.deviceId,
          hotelId: handoff.hotelId,
          roomId: targetRoomId,
        },
        process.env.JWT_SECRET || "default_jwt_secret",
        { expiresIn: "8h" },
      );
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const csrfToken = crypto.randomBytes(24).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const expiresAt = new Date(Date.now() + EIGHT_HOURS_MS);

    const session = await Session.create({
      tokenHash,
      type: "KIOSK",
      hotelId: handoff.hotelId,
      kioskId: kiosk._id,
      tableId: handoff.tableId || kiosk.tableId || null,
      roomId: targetRoomId,
      guestId: guestUser ? activeBooking.guestId._id : null,
      status: "ACTIVE",
      expiresAt,
      csrfToken,
      lastActivityAt: new Date(),
      metadata: {
        targetDashboard: handoff.targetDashboard,
        deviceId: kiosk.deviceId,
        name: kiosk.name,
        activeStay,
      },
    });

    setSessionCookie(res, rawToken);

    return res.status(200).json({
      success: true,
      message: activeStay
        ? "Kiosk guest dashboard session established successfully"
        : "Kiosk in-room standby mode (no active checked-in guest)",
      data: {
        token: rawToken,
        csrfToken,
        sessionType: "KIOSK",
        hotelId: session.hotelId,
        hotelName: hotelDoc?.name || "The Hotel",
        kioskId: kiosk._id,
        deviceId: kiosk.deviceId,
        tableId: session.tableId || null,
        roomId: targetRoomId,
        roomNumber: roomDoc?.roomNumber || null,
        roomType: roomDoc?.type || null,
        targetDashboard: handoff.targetDashboard,
        activeStay,
        guestToken,
        standbyToken,
        user: guestUser,
        reservationNo: activeBooking?.reservationNo || null,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    logger.error(error, "Exchange Kiosk Handoff Error");
    return res.status(500).json({
      success: false,
      message: "Failed to exchange kiosk handoff code",
    });
  }
};

/**
 * Validates the caller's active session and returns session info.
 */
export const validateCurrentSession = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      valid: true,
      sessionType: req.session.type,
      hotelId: req.session.hotelId,
      tableId: req.session.tableId,
      kioskId: req.session.kioskId,
      expiresAt: req.session.expiresAt,
      tableNumber: req.table?.tableNumber,
    },
  });
};

/**
 * Revokes the current session immediately.
 */
export const revokeCurrentSession = async (req, res) => {
  try {
    req.session.status = "REVOKED";
    req.session.revokedAt = new Date();
    req.session.revocationReason = "USER_LOGOUT";
    await req.session.save();

    clearSessionCookie(res);

    return res.status(200).json({
      success: true,
      message: "Session revoked successfully",
    });
  } catch (error) {
    logger.error(error, "Revoke Session Error");
    return res.status(500).json({
      success: false,
      message: "Failed to revoke session",
    });
  }
};

/**
 * GET /api/v1/sessions/kiosk-room-status
 * Idempotently checks if the room assigned to the authenticated kiosk device has an active checked-in stay.
 * Authenticated via kiosk Bearer standbyToken (role: "KIOSK") or session cookie.
 *
 * Used by in-room kiosk tablets during page reloads, network reconnection, or manual
 * "Check Stay Status" button taps to safely acquire guest JWT credentials without
 * re-submitting single-use handoff codes.
 */
export const getKioskRoomStatus = async (req, res) => {
  try {
    const kiosk = req.kiosk;
    const kioskId = kiosk?._id || req.session?.kioskId;
    const roomId = kiosk?.roomId || req.session?.roomId;
    const hotelId = kiosk?.hotelId || req.session?.hotelId;

    if (!kioskId || !roomId || !hotelId) {
      return res.status(400).json({
        success: false,
        message: "Kiosk terminal or assigned room not identified",
      });
    }

    // Query active stay for this room, sorting descending by createdAt to prioritize latest check-in
    const activeBooking = await Booking.findOne({
      hotelId,
      roomId,
      status: "checked-in",
    })
      .sort({ createdAt: -1 })
      .populate("guestId", "name email phone username isActive role");

    if (
      activeBooking &&
      activeBooking.guestId &&
      activeBooking.guestId.isActive !== false
    ) {
      const guestToken = jwt.sign(
        {
          userId: activeBooking.guestId._id,
          role: "GUEST",
          hotelId,
          roomId,
          kioskId,
        },
        process.env.JWT_SECRET || "default_jwt_secret",
        { expiresIn: "8h" },
      );

      const user = {
        id: activeBooking.guestId._id,
        name: activeBooking.guestId.name,
        username: activeBooking.guestId.username,
        role: "GUEST",
        hotelId,
        roomId,
        mustChangePassword: false,
      };

      return res.status(200).json({
        success: true,
        data: {
          activeStay: true,
          guestToken,
          user,
          reservationNo: activeBooking.reservationNo,
          roomId,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        activeStay: false,
        guestToken: null,
        user: null,
        roomId,
      },
    });
  } catch (error) {
    logger.error(error, "Get Kiosk Room Status Error");
    return res.status(500).json({
      success: false,
      message: "Failed to check kiosk room status",
    });
  }
};
