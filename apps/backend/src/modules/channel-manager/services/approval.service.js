import ChannelApproval from "#/modules/channel-manager/models/ChannelApproval.js";
import Room from "#/modules/rooms/models/Room.js";
import RatePlan from "#/modules/rate-plans/models/RatePlan.js";

// Aiosell codes (room types / rate plans) require MANUAL creation in the
// Aiosell dashboard before they can be pushed. Until a SUPER_ADMIN approves a
// code, rooms/rate plans referencing it stay "under_review" and are NOT synced.
// The ChannelApproval doc is the source of truth; Room/RatePlan carry a
// denormalized `channelSyncStatus` for UI badges.

export const KIND_ROOM = "ROOM";
export const KIND_RATE_PLAN = "RATE_PLAN";

// Returns the existing approval for (hotelId, kind, code), creating it as
// "under_review" when the code has never been seen before.
export async function getOrCreateApproval(hotelId, kind, code) {
  const normalizedCode = String(code).trim().toLowerCase();
  const key = { hotelId, kind, code: normalizedCode };

  const existing = await ChannelApproval.findOne(key);

  if (existing) {
    return existing;
  }

  return ChannelApproval.create({ ...key, status: "under_review" });
}

// The status a room/rate plan should carry for the given code. New/changed
// codes default to "under_review"; codes already approved stay "completed".
export async function resolveChannelStatus(hotelId, kind, code) {
  if (!code) return "completed";
  const approval = await getOrCreateApproval(hotelId, kind, code);
  return approval.status;
}

// Approve a code: flip the ChannelApproval doc and every Room/RatePlan doc
// using it to "completed". Returns the approval + number of docs updated.
export async function markCodeApproved(hotelId, kind, code, approvedBy) {
  const approval = await ChannelApproval.findOneAndUpdate(
    { hotelId, kind, code: String(code).trim().toLowerCase() },
    { status: "completed", approvedBy, approvedAt: new Date() },
    { new: true },
  );

  if (!approval) return null;

  let updatedDocs = 0;

  if (kind === KIND_ROOM) {
    const result = await Room.updateMany(
      { hotelId, roomCode: approval.code },
      { channelSyncStatus: "completed" },
    );
    updatedDocs = result.modifiedCount ?? 0;
  } else if (kind === KIND_RATE_PLAN) {
    const result = await RatePlan.updateMany(
      { hotelId, ratePlanCode: approval.code },
      { channelSyncStatus: "completed" },
    );
    updatedDocs = result.modifiedCount ?? 0;
  }

  return { approval, updatedDocs };
}
