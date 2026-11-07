import crypto from "node:crypto";
import {
  calculateDistanceMeters,
  SESSION_ERROR_CODES,
  SESSION_POLICIES,
} from "@hotelos/utils";
import Hotel from "#/modules/hotels/models/Hotel.js";
import Table from "#/modules/tables/models/Table.js";
import KioskDevice from "#/modules/kiosks/models/KioskDevice.js";
import Session from "#/modules/sessions/models/Session.js";
import logger from "#/utils/logger.js";

/**
 * Parses raw Cookie header string into a key-value dictionary without external dependencies.
 *
 * @param {string|undefined} cookieHeader - Raw HTTP Cookie header
 * @returns {Record<string, string>} Parsed cookies
 */
export function parseCookies(cookieHeader) {
  if (!cookieHeader || typeof cookieHeader !== "string") return {};
  const cookies = {};
  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const idx = pair.indexOf("=");
    if (idx < 0) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) {
      try {
        cookies[key] = decodeURIComponent(val);
      } catch {
        cookies[key] = val;
      }
    }
  }
  return cookies;
}

/**
 * Factory creating middleware to authenticate QR Guest or Kiosk sessions.
 *
 * @param {object} [options]
 * @param {boolean} [options.requireLocation=true] - Whether QR sessions must provide verified geolocation
 * @returns {import("express").RequestHandler}
 */
export function authenticateSession(options = {}) {
  const requireLocation = options.requireLocation !== false;

  return async (req, res, next) => {
    try {
      const cookies = parseCookies(req.headers.cookie);
      let rawToken = null;
      let fromCookie = false;

      const customHeader = req.headers["x-session-token"];
      const authHeader = req.headers.authorization;

      if (typeof customHeader === "string" && customHeader.trim()) {
        rawToken = customHeader.trim();
      } else if (authHeader && authHeader.startsWith("Bearer ")) {
        rawToken = authHeader.slice(7).trim();
      } else if (cookies.hotelos_session) {
        rawToken = cookies.hotelos_session;
        fromCookie = true;
      }

      if (!rawToken) {
        return res.status(401).json({
          success: false,
          code: SESSION_ERROR_CODES.SESSION_INVALID,
          message: "Session authentication required",
        });
      }

      const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      const session = await Session.findOne({ tokenHash });

      if (!session || session.status !== "ACTIVE") {
        return res.status(401).json({
          success: false,
          code: SESSION_ERROR_CODES.SESSION_INVALID,
          message: "Session is invalid or has been revoked",
        });
      }

      // Check absolute 8-hour expiry
      if (new Date() > session.expiresAt) {
        session.status = "EXPIRED";
        await session.save();
        return res.status(401).json({
          success: false,
          code: SESSION_ERROR_CODES.SESSION_EXPIRED,
          message:
            "Session has expired (8-hour maximum limit). Please scan table QR again.",
        });
      }

      // CSRF protection for cookie-based browser sessions
      if (fromCookie && session.csrfToken) {
        const csrfHeader = req.headers["x-csrf-token"];
        if (!csrfHeader || csrfHeader !== session.csrfToken) {
          return res.status(403).json({
            success: false,
            code: "CSRF_ERROR",
            message: "Missing or invalid CSRF token",
          });
        }
      }

      // Verify hotel exists and is active
      const hotel = await Hotel.findById(session.hotelId);
      if (!hotel || hotel.status !== "ACTIVE") {
        return res.status(403).json({
          success: false,
          code: SESSION_ERROR_CODES.HOTEL_INACTIVE,
          message: "Hotel service is currently unavailable",
        });
      }

      let table = null;
      let kiosk = null;

      if (session.type === "QR_GUEST") {
        table = await Table.findById(session.tableId);
        if (
          !table ||
          table.hotelId.toString() !== hotel._id.toString() ||
          table.status === "DISABLED" ||
          table.isOrderingEnabled === false
        ) {
          return res.status(403).json({
            success: false,
            code: SESSION_ERROR_CODES.TABLE_NOT_ORDERABLE,
            message: "Ordering for this table is currently unavailable",
          });
        }

        // Table reset generation verification
        if (table.sessionGeneration !== session.tableSessionGeneration) {
          session.status = "REVOKED";
          session.revokedAt = new Date();
          session.revocationReason = "TABLE_RESET";
          await session.save();

          return res.status(401).json({
            success: false,
            code: SESSION_ERROR_CODES.TABLE_SESSION_INVALIDATED,
            message:
              "This table was reset by hotel staff. Please scan the QR code again.",
          });
        }

        // Geolocation verification on every protected QR request
        if (requireLocation) {
          const latHeader =
            req.headers["x-location-latitude"] ?? req.body?.latitude;
          const lonHeader =
            req.headers["x-location-longitude"] ?? req.body?.longitude;
          const accHeader =
            req.headers["x-location-accuracy"] ?? req.body?.accuracy;

          const lat = parseFloat(latHeader);
          const lon = parseFloat(lonHeader);
          const acc = parseFloat(accHeader);

          if (Number.isNaN(lat) || Number.isNaN(lon)) {
            return res.status(400).json({
              success: false,
              code: SESSION_ERROR_CODES.LOCATION_REQUIRED,
              message:
                "Location coordinates (latitude and longitude) are required for table ordering",
            });
          }

          const maxAccuracy =
            hotel.locationSettings?.maxAccuracyMeters ??
            SESSION_POLICIES.MAX_ACCURACY_METERS;

          if (!Number.isNaN(acc) && acc > maxAccuracy) {
            return res.status(400).json({
              success: false,
              code: SESSION_ERROR_CODES.LOCATION_INACCURATE,
              message: `Reported location accuracy (±${Math.round(acc)}m) exceeds maximum allowed threshold (±${maxAccuracy}m). Please improve GPS/Wi-Fi signal and retry.`,
            });
          }

          // Prefer Table coordinates if configured; fallback to Hotel coordinates
          const hasTableCoords =
            table.coordinates &&
            typeof table.coordinates.latitude === "number" &&
            typeof table.coordinates.longitude === "number";

          const hasHotelCoords =
            hotel.coordinates &&
            typeof hotel.coordinates.latitude === "number" &&
            typeof hotel.coordinates.longitude === "number";

          if (!hasTableCoords && !hasHotelCoords) {
            // If location verification is explicitly disabled by admin, proceed; otherwise reject
            if (
              hotel.locationSettings?.isLocationVerificationRequired === false
            ) {
              logger.warn(
                { hotelId: hotel._id },
                "Location verification bypassed because neither table nor hotel coordinates are configured",
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
            const target = hasTableCoords
              ? table.coordinates
              : hotel.coordinates;
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
                message: `You are approximately ${Math.round(distance)}m away from the table, exceeding the permitted dining radius (${radius}m).`,
              });
            }
          }
        }
      } else if (session.type === "KIOSK") {
        kiosk = await KioskDevice.findById(session.kioskId);

        if (
          !kiosk ||
          !kiosk.isActive ||
          kiosk.status === "DISABLED" ||
          !kiosk.isPaired
        ) {
          session.status = "REVOKED";
          session.revokedAt = new Date();
          session.revocationReason = "KIOSK_DISABLED_OR_UNPAIRED";
          await session.save();

          return res.status(401).json({
            success: false,
            code: SESSION_ERROR_CODES.KIOSK_UNAUTHORIZED,
            message:
              "This kiosk terminal is no longer authorized or has been disabled",
          });
        }

        // Kiosks bypass browser geolocation check completely
      }

      // Record activity
      Session.updateOne(
        { _id: session._id },
        { $set: { lastActivityAt: new Date() } },
      ).catch(() => {});

      req.session = session;
      req.hotel = hotel;
      req.table = table;
      req.kiosk = kiosk;

      return next();
    } catch (error) {
      logger.error(error, "Session authentication middleware error");
      return res.status(500).json({
        success: false,
        message: "Internal server error during session authentication",
      });
    }
  };
}
