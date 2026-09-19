import {
  recordRoomRequest,
  recordRequest,
  KIND_ROOM,
} from "./approval.service.js";

export function detectMappingChange(previous, current, fields) {
  if (!previous || !current)
    return { changed: false, before: null, after: null };

  const before = {};
  const after = {};

  for (const field of fields) {
    const prevVal = previous[field] ?? "";
    const currVal = current[field] ?? "";
    if (String(prevVal) !== String(currVal)) {
      before[field] = prevVal;
      after[field] = currVal;
    }
  }

  const changed = Object.keys(before).length > 0;
  return {
    changed,
    before: changed ? before : null,
    after: changed ? after : null,
  };
}

export async function recordApprovalChange(
  hotelId,
  kind,
  code,
  {
    requestedBy,
    before,
    after,
    roomId = null,
    roomNumber = null,
    action = "update",
    updates = null,
  },
) {
  if (kind === KIND_ROOM) {
    const room = { _id: roomId, roomCode: code, roomNumber };
    return recordRoomRequest(hotelId, room, {
      requestedBy,
      before,
      after,
      action,
      updates,
    });
  }

  return recordRequest(hotelId, kind, code, {
    requestedBy,
    before,
    after,
    action,
    updates,
  });
}

export function updateEntitySyncStatus(entity, approval) {
  if (!entity || !approval) return;
  entity.channelSyncStatus = approval.status;
}

export const CHANNEL_ROOM_FIELDS = ["roomCode", "type", "rate", "floor"];
export const CHANNEL_RATE_PLAN_FIELDS = [
  "name",
  "ratePlanCode",
  "roomCode",
  "roomType",
  "occupancy",
  "mealPlan",
  "rate",
];

export const ratePlanSnapshot = (plan) => ({
  name: plan.name,
  ratePlanCode: plan.ratePlanCode,
  roomCode: plan.roomCode,
  roomType: plan.roomType,
  occupancy: plan.occupancy,
  mealPlan: plan.mealPlan,
  rate: plan.rate,
});
