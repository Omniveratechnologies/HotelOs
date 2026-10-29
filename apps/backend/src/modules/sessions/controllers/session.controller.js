import crypto from "node:crypto";
import {
  calculateDistanceMeters,
  SESSION_ERROR_CODES,
  SESSION_POLICIES,
} from "@hotelos/utils";
import Hotel from "#/modules/hotels/models/Hotel.js";
import Table from "#/modules/tables/models/Table.js";
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
      status: "ACTIVE",
      expiresAt,
      csrfToken,
      lastActivityAt: new Date(),
      metadata: {
        targetDashboard: handoff.targetDashboard,
        deviceId: kiosk.deviceId,
        name: kiosk.name,
      },
    });

    setSessionCookie(res, rawToken);

    return res.status(200).json({
      success: true,
      message: "Kiosk dashboard session established successfully",
      data: {
        token: rawToken,
        csrfToken,
        sessionType: "KIOSK",
        hotelId: session.hotelId,
        kioskId: kiosk._id,
        deviceId: kiosk.deviceId,
        tableId: session.tableId || null,
        targetDashboard: handoff.targetDashboard,
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
