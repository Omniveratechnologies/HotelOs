import ChannelApproval from "./models/ChannelApproval.js";
import Room from "#/modules/rooms/models/Room.js";
import RatePlan from "#/modules/rate-plans/models/RatePlan.js";
import RoomType from "#/modules/room-types/models/RoomType.js";
import Hotel from "#/modules/hotels/models/Hotel.js";
import { refreshRoomTypeCount } from "#/modules/room-types/services/roomType.service.js";
import { aiosellSyncInventory } from "#/shared/services/inventory.service.js";
import aiosell from "#/shared/services/aiosell.service.js";

// Under-review change requests for Aiosell codes and hotel details.
// Rooms, rate plans (RatePlan.ratePlanCode), room types (RoomType.roomCode)
// and hotel/property details are created/edited manually in the Aiosell
// dashboard — there is no config CRUD API. When a SUB_ADMIN or RECEPTIONIST
// creates or edits a room/rate-plan/room-type, or changes hotel info, a request
// is recorded as "under_review" with before/after snapshots. A SUPER_ADMIN does
// the work manually in Aiosell then clicks Verify; the backend fetches the
// property and auto-completes the request when the change is present.
// ROOM requests are PER-ROOM (keyed by roomId); room-type codes are shared by
// many physical rooms, so verification also checks that the property's room
// count meets the local count. Room/RatePlan/RoomType docs carry a
// denormalized `channelSyncStatus` (+ Room.channelVerified) for UI
// badges/guards.

export const KIND_ROOM = "ROOM";
export const KIND_RATE_PLAN = "RATE_PLAN";
export const KIND_ROOM_TYPE = "ROOM_TYPE";
export const KIND_HOTEL = "HOTEL";

// Returns the existing approval for (hotelId, kind, code), creating it as
// "under_review" when the code has never been seen before. Used for code-keyed
// kinds (RATE_PLAN); ROOM uses recordRoomRequest instead.
export async function getOrCreateApproval(hotelId, kind, code) {
  const normalizedCode = String(code).trim().toLowerCase();
  const key = { hotelId, kind, code: normalizedCode };

  const existing = await ChannelApproval.findOne(key);

  if (existing) {
    return existing;
  }

  return ChannelApproval.create({ ...key, status: "under_review" });
}

// The status a code should carry. New/changed codes default to "under_review";
// codes already approved stay "completed".
export async function resolveChannelStatus(hotelId, kind, code) {
  if (!code) return "completed";
  const approval = await getOrCreateApproval(hotelId, kind, code);
  return approval.status;
}

// Number of local rooms that map to a room-type code.
export async function countRoomsForCode(hotelId, code) {
  return Room.countDocuments({ hotelId, roomCode: code });
}

// A room TYPE is "under_review" while any of its per-room requests are pending.
export async function getRoomTypeStatus(hotelId, code) {
  if (!code) return "completed";
  const normalizedCode = String(code).trim().toLowerCase();
  const pending = await ChannelApproval.exists({
    hotelId,
    kind: KIND_ROOM,
    code: normalizedCode,
    status: "under_review",
  });
  return pending ? "under_review" : "completed";
}

// Compute delta between old and new object fields
export function computeDelta(before, after) {
  if (!before) return after || {};
  if (!after) return {};

  const delta = {};
  for (const [key, val] of Object.entries(after)) {
    if (before[key] !== val) {
      delta[key] = val;
    }
  }
  return delta;
}

// Record a PER-ROOM change request (create, edit or delete) storing only updates
export async function recordRoomRequest(
  hotelId,
  room,
  { requestedBy, before, after, desiredCount, action = "update", updates },
) {
  const code = String(room.roomCode || "")
    .trim()
    .toLowerCase();
  if (!code) return null;

  const count =
    action === "delete"
      ? 0
      : desiredCount != null
        ? desiredCount
        : await countRoomsForCode(hotelId, code);

  let deltaUpdates = updates;
  if (!deltaUpdates) {
    if (action === "delete") {
      deltaUpdates = { targetCount: 0 };
    } else if (action === "create") {
      deltaUpdates = {
        roomNumber: room.roomNumber,
        roomCode: code,
        roomType: after?.roomType || room.type,
        rate: after?.rate ?? room.rate,
        floor: after?.floor ?? room.floor,
        desiredCount: count,
      };
    } else {
      deltaUpdates = computeDelta(before, after);
      if (desiredCount != null) deltaUpdates.desiredCount = count;
    }
  }

  const setOnInsert = {
    kind: KIND_ROOM,
    hotelId,
    roomId: room._id,
    approvedAt: null,
    verifyAttempts: 0,
  };

  const update = {
    $set: {
      status: "under_review",
      action,
      code,
      roomNumber: room.roomNumber,
      updates: deltaUpdates,
      requestedBy: requestedBy || undefined,
      verifiedAt: null,
      resolvedAt: null,
      lastVerifyResult: null,
      lastVerifyMessage: null,
    },
    $setOnInsert: setOnInsert,
  };

  return ChannelApproval.findOneAndUpdate(
    { hotelId, kind: KIND_ROOM, roomId: room._id },
    update,
    { new: true, upsert: true },
  );
}

// Record a code-keyed change request (create or edit) storing only updates
export async function recordRequest(
  hotelId,
  kind,
  code,
  { requestedBy, before, after, action, updates },
) {
  const normalizedCode = String(code).trim().toLowerCase();

  const existing = await ChannelApproval.findOne({
    hotelId,
    kind,
    code: normalizedCode,
  });

  const isEdit = before != null;
  const status = isEdit ? "under_review" : existing?.status || "under_review";
  const requestAction = action || (isEdit ? "update" : "create");

  let deltaUpdates = updates;
  if (!deltaUpdates) {
    deltaUpdates = isEdit ? computeDelta(before, after) : after || {};
  }

  const setOnInsert = {
    code: normalizedCode,
    kind,
    hotelId,
    roomId: null,
    approvedAt: null,
    verifyAttempts: 0,
    lastVerifyResult: null,
    lastVerifyMessage: null,
  };

  const update = {
    $set: {
      status,
      action: requestAction,
      updates: deltaUpdates,
      requestedBy: requestedBy || undefined,
    },
    $setOnInsert: setOnInsert,
  };

  if (status === "under_review") {
    update.$set.verifiedAt = null;
    update.$set.resolvedAt = null;
    update.$set.lastVerifyResult = null;
    update.$set.lastVerifyMessage = null;
    delete setOnInsert.verifiedAt;
    delete setOnInsert.resolvedAt;
    delete setOnInsert.lastVerifyResult;
    delete setOnInsert.lastVerifyMessage;
  }

  return ChannelApproval.findOneAndUpdate(
    { hotelId, kind, code: normalizedCode, roomId: null },
    update,
    { new: true, upsert: true },
  );
}

// Verify whether the super-admin's manual Aiosell change is present by
// fetching the property and checking the relevant codes/fields exist.
// Returns { ok, status, message, approval }.
export async function verifyCodeApproval(hotelId, approvalId, verifiedBy) {
  const approval = await ChannelApproval.findById(approvalId);
  if (!approval) return { ok: false, error: "Approval not found" };
  if (approval.status !== "under_review") {
    return { ok: true, status: approval.status, message: "Already completed" };
  }

  const hotel = await Hotel.findById(hotelId).select("+aiosellHotelCode");
  if (!hotel) return { ok: false, error: "Hotel not found" };
  if (!hotel.aiosellHotelCode) {
    return { ok: false, error: "Hotel is not mapped to a property" };
  }

  const fetched = await aiosell.fetchPropertyDetails(hotel.aiosellHotelCode);
  if (!fetched.ok) {
    const detail = fetched.error
      ? typeof fetched.error === "string"
        ? fetched.error
        : JSON.stringify(fetched.error)
      : `Property API returned ${fetched.status}`;
    return { ok: false, error: `Failed to fetch property: ${detail}` };
  }

  const property = fetched.data;

  const result = await verifyByKind(hotelId, approval, property);

  const now = new Date();
  const increments = { $inc: { verifyAttempts: 1 } };
  const sets = {
    $set: {
      lastVerifyResult: result.found ? "FOUND" : "NOT_FOUND",
      lastVerifyMessage: result.message,
      verifyComparison: result.comparison || null,
      approvedBy: result.found ? verifiedBy || undefined : undefined,
    },
  };

  if (result.found) {
    const sets2 = {
      ...sets.$set,
      verifiedAt: now,
      resolvedAt: now,
      approvedAt: now,
      status: "completed",
    };
    sets.$set = sets2;

    // Trigger full sync from Aiosell to update local entities and push back availability/rates
    try {
      const { syncChannelFromAiosell } =
        await import("#/modules/channel-manager/sync/sync.service.js");
      await syncChannelFromAiosell(hotelId);
    } catch (syncErr) {
      console.error("[VERIFY] Auto-sync after verify failed:", syncErr);
    }

    if (approval.kind === KIND_ROOM) {
      if (approval.action === "delete") {
        if (approval.roomId) {
          await Room.deleteOne({ _id: approval.roomId, hotelId });
          await refreshRoomTypeCount(hotelId, approval.code);
          await aiosellSyncInventory(hotelId).catch(() => {});
        }
      } else if (approval.roomId) {
        await Room.updateOne(
          { _id: approval.roomId, hotelId },
          { channelSyncStatus: "completed", channelVerified: true },
        );
      }
    } else if (approval.kind === KIND_RATE_PLAN) {
      await RatePlan.updateMany(
        { hotelId, ratePlanCode: approval.code },
        { channelSyncStatus: "completed" },
      );
    } else if (approval.kind === KIND_ROOM_TYPE) {
      await RoomType.updateMany(
        { hotelId, roomCode: approval.code },
        { channelSyncStatus: "completed" },
      );
      await Room.updateMany(
        { hotelId, roomCode: approval.code, channelSyncStatus: "under_review" },
        { channelSyncStatus: "completed", channelVerified: true },
      );
    }
  }

  const updated = await ChannelApproval.findByIdAndUpdate(
    approvalId,
    { ...sets, ...increments },
    { new: true },
  );

  return {
    ok: true,
    status: updated.status,
    message: result.message,
    comparison: result.comparison || null,
    approval: updated,
  };
}

async function verifyByKind(hotelId, approval, property) {
  const { kind } = approval;
  const updates = approval.updates || approval.after || {};

  if (kind === KIND_ROOM) {
    const roomTypes = Array.isArray(property.rooms) ? property.rooms : [];
    const code = String(updates.roomCode || approval.code || "")
      .trim()
      .toLowerCase();
    const type = String(updates.roomType || "")
      .trim()
      .toLowerCase();
    const label = updates.roomType || code;

    const matchedType = roomTypes.find(
      (r) =>
        String(r.room_id || "")
          .trim()
          .toLowerCase() === code ||
        String(r.room_name || "")
          .trim()
          .toLowerCase() === type,
    );

    const propertyCount = Number(matchedType?.count) || 0;

    if (approval.action === "delete") {
      const localCount = await countRoomsForCode(hotelId, code);
      const targetCount = Math.max(localCount - 1, 0);
      const countOk = propertyCount <= targetCount;

      const comparison = {
        expected: { action: "delete", roomCode: code, targetCount },
        current: {
          roomCode: matchedType ? String(matchedType.room_id) : "not_found",
          count: propertyCount,
        },
        mismatches: countOk
          ? []
          : [
              `Room type count in Aiosell is ${propertyCount}, expected <= ${targetCount}`,
            ],
      };

      return {
        found: countOk,
        message: countOk
          ? `Room type "${label}" now has ${propertyCount} room${
              propertyCount === 1 ? "" : "s"
            } — deletion confirmed.`
          : `Room type "${label}" still has ${propertyCount} room${
              propertyCount === 1 ? "" : "s"
            } in Aiosell — drop it to ${targetCount}, then retry.`,
        comparison,
      };
    }

    const desiredCount = Number(updates.desiredCount) || 0;
    const countOk =
      Boolean(matchedType) &&
      (desiredCount === 0 || propertyCount >= desiredCount);

    const mismatches = [];
    if (!matchedType) {
      mismatches.push(
        `Room type with code "${code}" or name "${type || label}" is missing in Aiosell`,
      );
    } else if (desiredCount > 0 && propertyCount < desiredCount) {
      mismatches.push(
        `Room count in Aiosell is ${propertyCount}, expected at least ${desiredCount}`,
      );
    }

    const comparison = {
      expected: {
        roomCode: code,
        roomType: label,
        desiredCount: desiredCount || 1,
      },
      current: matchedType
        ? {
            roomCode: matchedType.room_id,
            roomType: matchedType.room_name,
            count: propertyCount,
          }
        : { status: "Not found in Aiosell property" },
      mismatches,
    };

    return {
      found: countOk,
      message: countOk
        ? `Room type "${label}" present with ${propertyCount} room${
            propertyCount === 1 ? "" : "s"
          }`
        : mismatches[0] || `Room type "${label}" verification failed.`,
      comparison,
    };
  }

  if (kind === KIND_RATE_PLAN) {
    const roomTypes = Array.isArray(property.rooms) ? property.rooms : [];
    const code = String(updates.ratePlanCode || approval.code || "")
      .trim()
      .toLowerCase();
    const name = String(updates.name || "")
      .trim()
      .toLowerCase();
    let found = false;
    let foundRoom = null;
    let foundPlan = null;

    for (const room of roomTypes) {
      const plans = Array.isArray(room.rateplans) ? room.rateplans : [];
      const match = plans.find(
        (rp) =>
          String(rp.rateplan_id || "")
            .trim()
            .toLowerCase() === code ||
          String(rp.rateplan_name || "")
            .trim()
            .toLowerCase() === name,
      );
      if (match) {
        found = true;
        foundRoom = room;
        foundPlan = match;
        break;
      }
    }

    const mismatches = found
      ? []
      : [
          `Rate plan with code "${code}" was not found under any room in Aiosell`,
        ];

    const comparison = {
      expected: {
        ratePlanCode: code,
        name: updates.name || code,
        roomCode: updates.roomCode || approval.code,
        occupancy: updates.occupancy,
        mealPlan: updates.mealPlan,
      },
      current: found
        ? {
            ratePlanCode: foundPlan.rateplan_id,
            ratePlanName: foundPlan.rateplan_name,
            roomCode: foundRoom.room_id,
          }
        : { status: "Not found in Aiosell" },
      mismatches,
    };

    return {
      found,
      message: found
        ? `Rate plan "${code}" found in property under room "${foundRoom.room_id}"`
        : `Rate plan "${code}" not found in property — create it in Aiosell under room "${updates.roomCode || approval.code}", then retry.`,
      comparison,
    };
  }

  if (kind === KIND_ROOM_TYPE) {
    const roomTypes = Array.isArray(property.rooms) ? property.rooms : [];
    const code = String(updates.roomCode || approval.code || "")
      .trim()
      .toLowerCase();
    const name = String(updates.name || "")
      .trim()
      .toLowerCase();
    const matchedType = roomTypes.find(
      (r) =>
        String(r.room_id || "")
          .trim()
          .toLowerCase() === code ||
        String(r.room_name || "")
          .trim()
          .toLowerCase() === name,
    );

    const propertyCount = Number(matchedType?.count) || 0;
    const requestedCount = Number(updates.count) || 0;
    const countOk =
      Boolean(matchedType) &&
      (requestedCount === 0 || propertyCount >= requestedCount);

    const mismatches = [];
    if (!matchedType) {
      mismatches.push(
        `Room type code "${code}" (name: "${name}") not found in Aiosell property`,
      );
    } else if (requestedCount > 0 && propertyCount < requestedCount) {
      mismatches.push(
        `Room type count in Aiosell is ${propertyCount}, expected at least ${requestedCount}`,
      );
    }

    const comparison = {
      expected: {
        roomCode: code,
        name: name || code,
        count: requestedCount,
      },
      current: matchedType
        ? {
            roomCode: matchedType.room_id,
            name: matchedType.room_name,
            count: propertyCount,
          }
        : { status: "Not found in Aiosell" },
      mismatches,
    };

    return {
      found: countOk,
      message: countOk
        ? `Room type "${updates.name || code}" present with ${propertyCount} room${
            propertyCount === 1 ? "" : "s"
          }`
        : mismatches[0] ||
          `Room type "${updates.name || code}" verification failed.`,
      comparison,
    };
  }

  if (kind === KIND_HOTEL) {
    const propName = String(property.hotel_name || "")
      .trim()
      .toLowerCase();
    const targetName = String(updates.name || "")
      .trim()
      .toLowerCase();
    const found = targetName
      ? propName.includes(targetName) || targetName.includes(propName)
      : Boolean(property.hotel_name);

    const mismatches = found
      ? []
      : [
          `Property name in Aiosell is "${property.hotel_name}", expected to match "${updates.name}"`,
        ];

    const comparison = {
      expected: { name: updates.name, aiosellHotelCode: property.hotel_id },
      current: {
        name: property.hotel_name,
        aiosellHotelCode: property.hotel_id,
      },
      mismatches,
    };

    return {
      found,
      message: found
        ? `Property "${property.hotel_name}" matches`
        : `Property name mismatch (expected "${updates.name}" but property shows "${property.hotel_name}") — update in Aiosell, then retry.`,
      comparison,
    };
  }

  return {
    found: false,
    message: "Unknown request kind",
    comparison: {
      expected: {},
      current: {},
      mismatches: ["Unknown request kind"],
    },
  };
}
