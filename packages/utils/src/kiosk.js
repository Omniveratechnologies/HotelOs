/**
 * @fileoverview Kiosk environment detection and default bridge configuration.
 * @module utils/kiosk
 */

/**
 * Default immutable bridge values injected into the Kiosk WebView.
 */
export const KIOSK_BRIDGE_DEFAULTS = Object.freeze({
  isKiosk: true,
  platform: "hotelos",
  version: "1.0.0",
});

/**
 * Detects whether the current execution context is inside a HotelOS Kiosk WebView.
 *
 * Checks `window.kiosk?.isKiosk === true`. Returns false in server-side
 * or standard browser contexts.
 *
 * @returns {boolean} True if running inside a HotelOS Kiosk terminal
 */
export function isKioskEnvironment() {
  if (typeof window === "undefined" || !window) {
    return false;
  }
  return Boolean(window.kiosk && window.kiosk.isKiosk === true);
}

/**
 * Standard Kiosk Dashboard Presets and metadata.
 */
export const KIOSK_DASHBOARDS_METADATA = Object.freeze({
  GUEST_DASHBOARD: {
    id: "GUEST_DASHBOARD",
    name: "Guest Dashboard",
    label: "Guest Dashboard",
    color: "bg-sky-50 text-sky-800 border-sky-200",
    description:
      "Touchscreen guest self-service hub, amenities, and room services",
  },
  SELF_CHECKIN: {
    id: "SELF_CHECKIN",
    name: "Self Check-In",
    label: "Self Check-In",
    color: "bg-emerald-50 text-emerald-800 border-emerald-200",
    description:
      "Guest self check-in, ID verification, and digital room key access",
  },
  DIGITAL_MENU: {
    id: "DIGITAL_MENU",
    name: "Digital Menu",
    label: "Digital Menu",
    color: "bg-amber-50 text-amber-900 border-amber-200",
    description: "Digital restaurant menu, dining order, and guest billing",
  },
});

/**
 * Standard hardware peripheral features supported by HotelOS kiosks.
 */
export const KIOSK_SUPPORTED_FEATURES = Object.freeze([
  { id: "CHECK_IN", label: "Self Check-In" },
  { id: "KEY_DISPENSE", label: "Room Key Dispenser" },
  { id: "DOCUMENT_SCAN", label: "ID / Passport Scanner" },
  { id: "DIGITAL_MENU", label: "Digital Menu & Ordering" },
  { id: "ROOM_SERVICE", label: "Room Service Requests" },
]);

export const KIOSK_FEATURE_LABELS = Object.freeze(
  Object.fromEntries(KIOSK_SUPPORTED_FEATURES.map((f) => [f.id, f.label])),
);
