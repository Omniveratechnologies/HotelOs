import env from "#/config/env.js";

/**
 * Embedded dashboard configurations for HotelOS Kiosks.
 *
 * Each dashboard has a descriptive name, unique id, and designated URL
 * retrieved directly from the validated backend environment configuration.
 */
export const KIOSK_DASHBOARDS = [
  {
    id: "GUEST_DASHBOARD",
    name: "Guest Dashboard",
    description:
      "Touchscreen guest self-service hub, amenities, and room services",
    url: env.kiosk.guestDashboardUrl,
  },
  {
    id: "SELF_CHECKIN",
    name: "Self Check-In",
    description:
      "Guest self check-in, ID verification, and digital room key access",
    url: env.kiosk.selfCheckinUrl,
  },
  {
    id: "DIGITAL_MENU",
    name: "Digital Menu",
    description: "Digital restaurant menu, dining order, and guest billing",
    url: env.kiosk.digitalMenuUrl,
  },
];

/**
 * Resolves the assigned URL for a kiosk terminal based on dashboard type.
 * Note: assignedUrl is not stored in MongoDB; it is computed dynamically from this config.
 *
 * @param {string|object} targetDashboard - Target dashboard ID or kiosk device object
 * @returns {string} The resolved dashboard URL
 */
export function resolveKioskAssignedUrl(targetDashboard) {
  const mode =
    typeof targetDashboard === "object" && targetDashboard !== null
      ? targetDashboard.targetDashboard
      : targetDashboard;

  const preset = KIOSK_DASHBOARDS.find((d) => d.id === mode);
  if (preset) {
    return preset.url;
  }

  // Fallback to the primary Guest Dashboard if unknown/unassigned
  return KIOSK_DASHBOARDS[0].url;
}
