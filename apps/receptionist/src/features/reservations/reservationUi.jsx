// Display helpers for the reservations feature (statuses, sources, badges).

export const STATUS_VARIANT = {
  draft: "draft",
  pending: "pending",
  confirmed: "confirmed",
  reserved: "pending",
  "checked-in": "checked-in",
  "checked-out": "checked-out",
  cancelled: "cancelled",
  "no-show": "cancelled",
};

export const STATUS_LABEL = {
  draft: "Draft",
  pending: "Pending",
  confirmed: "Confirmed",
  reserved: "Reserved",
  "checked-in": "Checked-in",
  "checked-out": "Checked-out",
  cancelled: "Cancelled",
  "no-show": "No-show",
};

export const SOURCE_BADGE_CLASS = {
  DIRECT: "bg-blue-50 text-blue-700 border-blue-200",
  WEBSITE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PHONE: "bg-amber-50 text-amber-700 border-amber-200",
  OTA: "bg-orange-50 text-orange-700 border-orange-200",
  CORPORATE: "bg-violet-50 text-violet-700 border-violet-200",
  GROUP: "bg-indigo-50 text-indigo-700 border-indigo-200",
  OTHER: "border-gray-200 bg-gray-50 text-gray-600",
};

const SOURCE_LABEL = {
  DIRECT: "Direct",
  WEBSITE: "Website",
  PHONE: "Phone",
  OTA: "OTA",
  CORPORATE: "Corporate",
  GROUP: "Group",
  OTHER: "Other",
};

const OTA_CHANNEL_LABEL = {
  BOOKING_COM: "Booking.com",
  AIRBNB: "Airbnb",
  AGODA: "Agoda",
  EXPEDIA: "Expedia",
  GOIBIBO: "Goibibo",
  MAKEMYTRIP: "MakeMyTrip",
  OTHER: "OTA",
};

export function sourceLabel(reservation) {
  if (reservation.source === "OTA") {
    return (
      OTA_CHANNEL_LABEL[
        reservation.otaChannel || reservation.otaInfo?.channel
      ] || "OTA"
    );
  }
  return SOURCE_LABEL[reservation.source] || "Direct";
}

export function guestInitials(name) {
  const parts = String(name || "G")
    .trim()
    .split(/\s+/);
  return (
    (parts[0]?.[0] || "G") +
    (parts.length > 1 ? parts[parts.length - 1]?.[0] : "")
  ).toUpperCase();
}
