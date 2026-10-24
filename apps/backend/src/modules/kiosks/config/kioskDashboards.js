/**
 * Embedded dashboard configurations for HotelOS Kiosks.
 *
 * Each dashboard has a descriptive name, unique id, and default demo URL
 * that can be overridden via environment variables.
 *
 * TODO: In production, these URLs should be configured per hotel deployment
 * or dynamically parameterized with hotelId / kioskId query parameters:
 * e.g. `${dashboard.url}?hotelId=${kiosk.hotelId}&kioskId=${kiosk._id}`
 */

export const KIOSK_DASHBOARDS = [
  {
    id: "DEMO_PORTAL",
    name: "HotelOS Interactive Demo",
    description: "Default interactive kiosk showcase and feature demo",
    url:
      process.env.KIOSK_DEMO_PORTAL_URL ||
      "https://demo.hotelos.com/kiosk-showcase",
  },
  {
    id: "GUEST_CHECKIN",
    name: "Guest Self Check-In",
    description:
      "Touchscreen guest self check-in, registration, and room key access",
    url:
      process.env.KIOSK_GUEST_CHECKIN_URL ||
      "https://demo.hotelos.com/guest-checkin",
  },
  {
    id: "TABLE_ORDER",
    name: "Restaurant & Table Ordering",
    description: "Digital restaurant menu, dining order, and guest billing",
    url:
      process.env.KIOSK_TABLE_ORDER_URL ||
      "https://demo.hotelos.com/table-order",
  },
  {
    id: "RECEPTIONIST_EXPRESS",
    name: "Receptionist Express Terminal",
    description: "Fast-track front desk concierge and self-service station",
    url:
      process.env.KIOSK_RECEPTIONIST_EXPRESS_URL ||
      "https://demo.hotelos.com/receptionist-express",
  },
];

/**
 * Resolves the assigned URL for a kiosk terminal based on dashboard type or custom URL.
 */
export function resolveKioskAssignedUrl(kiosk) {
  // If a custom URL is explicitly provided, use it
  if (kiosk.customUrl?.trim()) {
    return kiosk.customUrl.trim();
  }

  // Find matching dashboard preset
  const preset = KIOSK_DASHBOARDS.find((d) => d.id === kiosk.targetDashboard);
  if (preset) {
    // TODO: In production, parameterize the URL as per hotel setup:
    // e.g. `${preset.url}?hotelId=${kiosk.hotelId}&kioskId=${kiosk._id}`
    return preset.url;
  }

  // Fallback default
  return (
    process.env.KIOSK_DEMO_PORTAL_URL ||
    "https://demo.hotelos.com/kiosk-showcase"
  );
}
