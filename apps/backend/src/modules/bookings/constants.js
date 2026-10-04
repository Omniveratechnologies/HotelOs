// Reservation domain constants (booking module).

/** All valid reservation statuses (kebab/lowercase, matching repo style). */
export const RESERVATION_STATUSES = [
  "draft",
  "pending",
  "confirmed",
  // Legacy alias for future stays — kept so existing flows keep working.
  "reserved",
  "checked-in",
  "checked-out",
  "cancelled",
  "no-show",
];

/** Statuses that hold room inventory and count against availability. */
export const ACTIVE_STAY_STATUSES = [
  "pending",
  "confirmed",
  "reserved",
  "checked-in",
];

/** Statuses that count as a guest's "current stay" for portal lookups. */
export const CURRENT_STAY_STATUSES = ["reserved", "confirmed", "checked-in"];

/** Booking sources (uppercase; stored on the reservation). */
export const RESERVATION_SOURCES = [
  "DIRECT",
  "WEBSITE",
  "PHONE",
  "CORPORATE",
  "GROUP",
  "OTA",
  "OTHER",
];

/** Known OTA channels (stored on otaInfo.channel). */
export const OTA_CHANNELS = [
  "BOOKING_COM",
  "AIRBNB",
  "AGODA",
  "EXPEDIA",
  "GOIBIBO",
  "MAKEMYTRIP",
  "OTHER",
];

/** Payment statuses stored on the reservation. */
export const PAYMENT_STATUSES = ["unpaid", "partially-paid", "paid"];

/** Allowed status transitions; missing key or empty list = terminal state. */
export const STATUS_TRANSITIONS = {
  draft: ["pending", "confirmed", "checked-in", "cancelled"],
  pending: ["confirmed", "cancelled"],
  confirmed: ["checked-in", "cancelled", "no-show"],
  reserved: ["checked-in", "cancelled", "no-show"],
  "checked-in": ["checked-out"],
  "checked-out": [],
  cancelled: [],
  "no-show": [],
};

/**
 * Whether transitioning a reservation from one status to another is allowed.
 * Same-status "transitions" are a no-op and allowed.
 *
 * @param {string} from
 * @param {string} to
 * @returns {boolean}
 */
export function canTransition(from, to) {
  if (from === to) return true;
  return (STATUS_TRANSITIONS[from] || []).includes(to);
}
