/**
 * @fileoverview Standard session error codes and policy defaults.
 * @module utils/sessionConstants
 */

/**
 * Standard error codes returned by the session authentication and location verification systems.
 */
export const SESSION_ERROR_CODES = Object.freeze({
  LOCATION_REQUIRED: "LOCATION_REQUIRED",
  LOCATION_PERMISSION_DENIED: "LOCATION_PERMISSION_DENIED",
  LOCATION_UNAVAILABLE: "LOCATION_UNAVAILABLE",
  LOCATION_INACCURATE: "LOCATION_INACCURATE",
  LOCATION_OUTSIDE_RADIUS: "LOCATION_OUTSIDE_RADIUS",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  SESSION_REVOKED: "SESSION_REVOKED",
  SESSION_INVALID: "SESSION_INVALID",
  TABLE_SESSION_INVALIDATED: "TABLE_SESSION_INVALIDATED",
  TABLE_NOT_ORDERABLE: "TABLE_NOT_ORDERABLE",
  HOTEL_INACTIVE: "HOTEL_INACTIVE",
  KIOSK_UNAUTHORIZED: "KIOSK_UNAUTHORIZED",
  INVALID_OR_EXPIRED_HANDOFF_CODE: "INVALID_OR_EXPIRED_HANDOFF_CODE",
});

/**
 * Default policies for HotelOS sessions.
 */
export const SESSION_POLICIES = Object.freeze({
  /** Table proximity radius when table coordinates are available (in metres) */
  DEFAULT_TABLE_RADIUS_METERS: 50,
  /** Fallback proximity radius when only hotel coordinates are available (in metres) */
  DEFAULT_HOTEL_RADIUS_METERS: 100,
  /** Maximum acceptable reported GPS accuracy (in metres) */
  MAX_ACCURACY_METERS: 50,
  /** Absolute session lifetime (in hours) */
  ABSOLUTE_LIFETIME_HOURS: 8,
  /** Single-use kiosk handoff code expiry window (in seconds) */
  KIOSK_HANDOFF_TTL_SECONDS: 60,
});

/**
 * Standard client-side session storage keys for web & kiosk applications.
 */
export const SESSION_STORAGE_KEYS = Object.freeze({
  PREFIX: "hotelos_session_",
  KIOSK_CURRENT: "hotelos_kiosk_current_session",
  getSessionKey: (hotelId, tableId) =>
    `hotelos_session_${hotelId || "kiosk"}_${tableId || "kiosk"}`,
});
