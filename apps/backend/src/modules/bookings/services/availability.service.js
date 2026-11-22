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
    .select(
      "roomId roomTypeCode rooms roomAllocations roomRequirements checkIn checkOut",
    )
    .lean();

  // Resolve assigned-room bookings to their room's type code.
  const assignedRoomIds = [];
  for (const b of held) {
    if (b.roomId) assignedRoomIds.push(b.roomId);
    if (Array.isArray(b.roomAllocations)) {
      for (const a of b.roomAllocations) {
        if (a.roomId) assignedRoomIds.push(a.roomId);
      }
    }
  }

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
    if (
      Array.isArray(booking.roomAllocations) &&
      booking.roomAllocations.length > 0
    ) {
      for (const alloc of booking.roomAllocations) {
        const code = alloc.roomId
          ? codeByRoomId.get(String(alloc.roomId))
          : alloc.roomTypeCode;
        if (!code) continue;
        heldByCode.set(code, (heldByCode.get(code) || 0) + 1);
      }
    } else if (
      Array.isArray(booking.roomRequirements) &&
      booking.roomRequirements.length > 0
    ) {
      for (const req of booking.roomRequirements) {
        if (!req.roomTypeCode) continue;
        heldByCode.set(
          req.roomTypeCode,
          (heldByCode.get(req.roomTypeCode) || 0) + Math.max(1, req.rooms || 1),
        );
      }
    } else {
      const code = booking.roomId
        ? codeByRoomId.get(String(booking.roomId))
        : booking.roomTypeCode;
      if (!code) continue;
      heldByCode.set(
        code,
        (heldByCode.get(code) || 0) + Math.max(1, booking.rooms || 1),
      );
    }
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

  const roomIds = rooms.map((r) => r._id);
  const conflicts = await Booking.find({
    hotelId,
    $or: [
      { roomId: { $in: roomIds } },
      { "roomAllocations.roomId": { $in: roomIds } },
    ],
    ...overlapFilter(checkIn, checkOut),
    ...(excludedBookingId ? { _id: { $ne: excludedBookingId } } : {}),
  }).lean();

  const blocked = new Set();
  for (const b of conflicts) {
    if (b.roomId) blocked.add(String(b.roomId));
    if (Array.isArray(b.roomAllocations)) {
      for (const a of b.roomAllocations) {
        if (a.roomId) blocked.add(String(a.roomId));
      }
    }
  }

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

/**
 * Asserts availability for multiple room types / blocks simultaneously.
 *
 * @param {string|import("mongoose").Types.ObjectId} hotelId
 * @param {Array<{ roomTypeCode: string, rooms: number }>} requirements
 * @param {Date} checkIn
 * @param {Date} checkOut
 * @param {string|import("mongoose").Types.ObjectId|null} [excludedBookingId]
 * @returns {Promise<{ ok: boolean, conflict: object|null, message?: string, availability: Array<object> }>}
 */
export async function assertMultiTypeAvailability(
  hotelId,
  requirements = [],
  checkIn,
  checkOut,
  excludedBookingId = null,
) {
  const types = await getTypeAvailability(
    hotelId,
    checkIn,
    checkOut,
    excludedBookingId,
  );
  const typeMap = new Map(types.map((t) => [t.roomTypeCode.toLowerCase(), t]));

  const requestedByCode = new Map();
  for (const req of requirements) {
    if (!req.roomTypeCode) continue;
    const code = String(req.roomTypeCode).toLowerCase().trim();
    const count = Number(req.rooms || req.units || 1);
    requestedByCode.set(code, (requestedByCode.get(code) || 0) + count);
  }

  for (const [code, requestedCount] of requestedByCode.entries()) {
    const typeInfo = typeMap.get(code);
    const available = typeInfo?.available ?? 0;
    if (available < requestedCount) {
      return {
        ok: false,
        conflict: {
          roomTypeCode: code,
          typeName: typeInfo?.name || code,
          available,
          requested: requestedCount,
        },
        message: `Only ${available} room(s) of type '${typeInfo?.name || code}' available for the selected dates (requested ${requestedCount})`,
        availability: types,
      };
    }
  }

  return {
    ok: true,
    conflict: null,
    availability: types,
  };
}
