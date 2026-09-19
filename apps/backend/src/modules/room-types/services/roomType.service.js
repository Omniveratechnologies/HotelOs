import Room from "#/modules/rooms/models/Room.js";
import RoomType from "../models/RoomType.js";

// Recompute a room type's `count` from the rooms actually linked to its code.
// The count is derived (source of truth = Room records), so any create/delete
// or re-code of a room must refresh it.
export async function refreshRoomTypeCount(hotelId, roomCode) {
  if (!roomCode) return null;

  const normalized = String(roomCode).trim().toLowerCase();
  const count = await Room.countDocuments({
    hotelId,
    roomCode: normalized,
  });

  const updated = await RoomType.findOneAndUpdate(
    { hotelId, roomCode: normalized },
    { $set: { count } },
    { new: true },
  );

  return updated?.count ?? null;
}
