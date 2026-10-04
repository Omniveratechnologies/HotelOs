import Booking from "../models/Booking.js";
import Room from "#/modules/rooms/models/Room.js";
import RoomType from "#/modules/room-types/models/RoomType.js";

import { ACTIVE_STAY_STATUSES } from "../constants.js";

// Availability = active room inventory per type minus units held by
// overlapping active-status reservations (confirmed/reserved/pending/
// checked-in). Checkout day is available for the next check-in (exclusive
// bounds).

function overlapFilter(checkIn, checkOut) {
  return {
    status: { $in: ACTIVE_STAY_STATUSES },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  };
}

/**
 * Per-room-type availability for a date range.
 *
 * @param {string|import("mongoose").Types.ObjectId} hotelId
 * @param {Date} checkIn
 * @param {Date} checkOut
 * @param {string|import("mongoose").Types.ObjectId|null} [excludedBookingId] - Booking to ignore (modify/move flows).
 * @returns {Promise<Array<{ roomTypeCode: string, name: string, totalRooms: number, heldUnits: number, available: number }>>}
 */
export async function getTypeAvailability(
  hotelId,
  checkIn,
  checkOut,
  excludedBookingId = null,
) {
  const roomTypes = await RoomType.find({ hotelId, active: true }).lean();

  // Physical rooms per roomCode (skip un-verified / pending-delete stock).
  const rooms = await Room.find({
    hotelId,
    pendingDelete: { $ne: true },
    channelVerified: { $ne: false },
  })
    .select("roomCode type")
    .lean();

  const totalByCode = new Map();
  for (const room of rooms) {
    const code = room.roomCode || String(room.type || "").toLowerCase();
    totalByCode.set(code, (totalByCode.get(code) || 0) + 1);
  }

  const held = await Booking.find({
    hotelId,
    ...overlapFilter(checkIn, checkOut),
    ...(excludedBookingId ? { _id: { $ne: excludedBookingId } } : {}),
  })
    .select("roomId roomTypeCode rooms checkIn checkOut")
    .lean();

  // Resolve assigned-room bookings to their room's type code.
  const assignedRoomIds = held.filter((b) => b.roomId).map((b) => b.roomId);
  const assignedRooms = await Room.find({ _id: { $in: assignedRoomIds } })
    .select("roomCode type")
    .lean();
  const codeByRoomId = new Map(
    assignedRooms.map((r) => [
      String(r._id),
      r.roomCode || String(r.type || "").toLowerCase(),
    ]),
  );

  const heldByCode = new Map();
  for (const booking of held) {
    const code = booking.roomId
      ? codeByRoomId.get(String(booking.roomId))
      : booking.roomTypeCode;
    if (!code) continue;
    heldByCode.set(
      code,
      (heldByCode.get(code) || 0) + Math.max(1, booking.rooms || 1),
    );
  }

  return roomTypes.map((rt) => {
    const code = rt.roomCode;
    const total = totalByCode.get(code) ?? rt.count ?? 0;
    const heldUnits = heldByCode.get(code) || 0;
    return {
      roomTypeCode: code,
      name: rt.name,
      totalRooms: total,
      heldUnits,
      available: Math.max(0, total - heldUnits),
    };
  });
}

/**
 * Rooms of a type that are free for the whole range (no overlapping assigned
 * booking and not blocked by channel review / delete).
 *
 * @param {string|import("mongoose").Types.ObjectId} hotelId
 * @param {string} roomTypeCode
 * @param {Date} checkIn
 * @param {Date} checkOut
 * @param {string|import("mongoose").Types.ObjectId|null} [excludedBookingId]
 * @returns {Promise<Array<object>>} room docs (lean)
 */
export async function listAvailableRooms(
  hotelId,
  roomTypeCode,
  checkIn,
  checkOut,
  excludedBookingId = null,
) {
  const rooms = await Room.find({
    hotelId,
    roomCode: roomTypeCode,
    pendingDelete: { $ne: true },
    channelVerified: { $ne: false },
  })
    .sort({ roomNumber: 1 })
    .lean();

  if (rooms.length === 0) return [];

  const conflicts = await Booking.find({
    hotelId,
    roomId: { $in: rooms.map((r) => r._id) },
    ...overlapFilter(checkIn, checkOut),
    ...(excludedBookingId ? { _id: { $ne: excludedBookingId } } : {}),
  }).distinct("roomId");

  const blocked = new Set(conflicts.map(String));
  return rooms.filter((room) => !blocked.has(String(room._id)));
}

/**
 * Assert that `units` rooms of `roomTypeCode` are free for the range.
 *
 * @returns {Promise<{ ok: boolean, available: number }>}
 */
export async function assertTypeAvailability(
  hotelId,
  roomTypeCode,
  checkIn,
  checkOut,
  units = 1,
  excludedBookingId = null,
) {
  const types = await getTypeAvailability(
    hotelId,
    checkIn,
    checkOut,
    excludedBookingId,
  );
  const type = types.find((t) => t.roomTypeCode === roomTypeCode);
  const available = type?.available ?? 0;
  return { ok: available >= units, available };
}
