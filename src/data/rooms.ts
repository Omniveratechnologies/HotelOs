import type { Room } from "@/types/guest-dashboard";

/**
 * PLACEHOLDER room/guest directory.
 * In production this is a PMS/backend lookup keyed by the room identifier
 * encoded in the in-room QR code (`?room=204`).
 */
export const ROOMS: Room[] = [
  {
    roomNumber: "1204",
    guestName: "Aditya",
    tier: "Meridian Club",
    checkIn: "2026-07-30",
    checkOut: "2026-08-04",
  },
  {
    roomNumber: "204",
    guestName: "Meera",
    tier: "Meridian Club",
    checkIn: "2026-08-01",
    checkOut: "2026-08-03",
  },
  {
    roomNumber: "812",
    guestName: "Jonas",
    tier: "Signature Floor",
    checkIn: "2026-08-02",
    checkOut: "2026-08-06",
  },
];

export const DEFAULT_ROOM_NUMBER = "1204";

/** Resolves the room for a QR/query-param value, falling back to the demo suite. */
export function findRoom(roomNumber?: string | undefined): Room {
  const fallback = ROOMS.find((r) => r.roomNumber === DEFAULT_ROOM_NUMBER) ?? (ROOMS[0] as Room);
  if (!roomNumber) return fallback;
  return ROOMS.find((r) => r.roomNumber === roomNumber) ?? fallback;
}
