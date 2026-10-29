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
    url: env.frontendUrls.guest,
  },
  {
    id: "SELF_CHECKIN",
    name: "Self Check-In",
    description:
      "Guest self check-in, ID verification, and digital room key access",
    url: env.frontendUrls.selfCheckin,
  },
  {
    id: "DIGITAL_MENU",
    name: "Digital Menu",
    description: "Digital restaurant menu, dining order, and guest billing",
    url: env.frontendUrls.tableOrder,
  },
];

/**
 * Resolves the assigned URL for a kiosk terminal based on dashboard type and optional table mapping.
 * Note: assignedUrl is not stored in MongoDB; it is computed dynamically from this config.
 *
 * @param {string|object} targetDashboard - Target dashboard ID or kiosk device object
 * @param {string} [hotelId] - Optional hotel ID (if not on targetDashboard object)
 * @param {string} [tableId] - Optional dining table ID (if not on targetDashboard object)
 * @returns {string} The resolved dashboard URL
 */
export function resolveKioskAssignedUrl(targetDashboard, hotelId, tableId) {
  const isObj = typeof targetDashboard === "object" && targetDashboard !== null;
  const mode = isObj ? targetDashboard.targetDashboard : targetDashboard;

  const preset = KIOSK_DASHBOARDS.find((d) => d.id === mode);
  if (!preset) {
    return KIOSK_DASHBOARDS[0].url;
  }

  // When Digital Menu is selected and an assigned table is specified, route directly to that table's menu
  if (mode === "DIGITAL_MENU") {
    const hId = isObj
      ? targetDashboard.hotelId?._id || targetDashboard.hotelId
      : hotelId;
    const tId = isObj
      ? targetDashboard.tableId?._id || targetDashboard.tableId
      : tableId;

    if (hId && tId) {
      return `${preset.url}/${hId}/table/${tId}/menu`;
    }
  }

  return preset.url;
}
