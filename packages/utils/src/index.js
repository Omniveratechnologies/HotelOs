/**
 * @fileoverview Entry point for the utils package, re-exporting utility functions, constants, normalizers, and helpers.
 * @module utils
 */

export { cn, clsx, twMerge, twJoin } from "./cn.js";

export {
  deriveRatePlanCode,
  parseRatePlanCode,
  OCCUPANCY_LETTER_BY_TYPE,
  OCCUPANCY_TYPE_BY_LETTER,
} from "./ratePlanCode.js";

export {
  ORDER_STATUS_MAP,
  UI_TO_ORDER_STATUS,
  REQUEST_STATUS_MAP,
  REQUEST_TYPE_MAP,
} from "./constants.js";

export {
  formatTime,
  formatDate,
  formatCurrency,
  toLocalDateString,
} from "./formatters.js";

export {
  normalizeRoom,
  normalizeGuest,
  normalizeFoodOrder,
  normalizeRequest,
  upsert,
} from "./normalizers.js";

export {
  isKioskEnvironment,
  KIOSK_BRIDGE_DEFAULTS,
  KIOSK_DASHBOARDS_METADATA,
  KIOSK_SUPPORTED_FEATURES,
  KIOSK_FEATURE_LABELS,
} from "./kiosk.js";
export { calculateDistanceMeters } from "./geo.js";
export {
  SESSION_ERROR_CODES,
  SESSION_POLICIES,
  SESSION_STORAGE_KEYS,
} from "./sessionConstants.js";
