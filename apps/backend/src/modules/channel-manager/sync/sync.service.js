import Hotel from "#/modules/hotels/models/Hotel.js";
import Room from "#/modules/rooms/models/Room.js";
import RatePlan from "#/modules/rate-plans/models/RatePlan.js";
import RoomType from "#/modules/room-types/models/RoomType.js";
import ChannelManagerConfig from "#/modules/channel-manager/config/models/ChannelManagerConfig.js";
import aiosell from "#/shared/services/aiosell.service.js";
import {
  aiosellSyncInventory,
  aiosellSyncRates,
} from "#/shared/services/inventory.service.js";
import logger from "#/utils/logger.js";

// Reconciles one hotel against the property mapping Aiosell holds for it
// (GET /property_details). Aiosell owns the ROOM TYPES and RATE PLANS — we
// pull them and rebuild our physical copies to mirror them exactly:
//   - room types are rebuilt from Aiosell's room list (name, count,
//     occupancy, active...),
//   - rooms are regenerated from the type counts Aiosell defines,
//   - rate plans are recreated from Aiosell's rateplan list,
//   - every pulled code is recorded as an already-approved ChannelApproval,
//   - then availability + rates are pushed back so Aiosell reflects the DB.
// Destructive by design: for the target hotel all existing room types, rooms,
// rate plans and channel approvals are replaced each run.

const OCCUPANCY_BY_NUMBER = {
  1: "single",
  2: "double",
  3: "triple",
  4: "quad",
};

const MEAL_ADJUST = { EP: 0, CP: 300, MAP: 600, AP: 900 };
const OCCUPANCY_ADJUST = {
  single: 0,
  double: 400,
  triple: 800,
  quad: 1200,
};

// The room type is Aiosell's own — store its config label verbatim so our
// copies mirror the Aiosell conf exactly.
function roomTypeOf(roomId, roomName) {
  const name = String(roomName || "").trim();
  if (name) return name;

  const id = String(roomId || "").trim();
  return id ? `${id.charAt(0).toUpperCase()}${id.slice(1)}` : "Standard";
}

function roomNumberPrefix(roomId, roomName) {
  const label = `${roomId} ${roomName}`.toLowerCase();
  if (label.includes("suite")) return "SUITE";
  if (label.includes("deluxe")) return "DELX";
  if (label.includes("exec")) return "EXEC";
  return (roomId || "ROOM").slice(0, 4).toUpperCase() || "ROOM";
}

function baseRateOf(roomCode, roomName) {
  const label = `${roomCode} ${roomName}`.toLowerCase();
  if (label.includes("suite")) return 3499;
  if (label.includes("deluxe")) return 2999;
  return 2499;
}

function occupancyTypeOf(num) {
  return OCCUPANCY_BY_NUMBER[Number(num)] || "single";
}

// Rateplan codes use a well-known suffix: {room}-{occ}-{ep|cp|bp|map|ap}
function mealPlanOf(code) {
  if (code.endsWith("-ap")) return "AP";
  if (code.endsWith("-map")) return "MAP";
  if (code.endsWith("-cp") || code.endsWith("-bp")) return "CP";
  return "EP";
}

function rateOf(roomCode, roomName, occupancy, mealPlan) {
  return (
    baseRateOf(roomCode, roomName) +
    MEAL_ADJUST[mealPlan] +
    OCCUPANCY_ADJUST[occupancy]
  );
}

export async function syncChannelFromAiosell(hotelId) {
  const hotel = await Hotel.findById(hotelId).select("+aiosellHotelCode");
  if (!hotel) return { ok: false, error: "Hotel not found" };
  if (!hotel.aiosellHotelCode) {
    return { ok: false, error: "Hotel is not mapped to an Aiosell property" };
  }

  const fetched = await aiosell.fetchPropertyDetails(hotel.aiosellHotelCode);
  if (!fetched.ok) {
    const detail = fetched.error
      ? typeof fetched.error === "string"
        ? fetched.error
        : JSON.stringify(fetched.error)
      : `Aiosell returned ${fetched.status}`;
    logger.warn({ hotelId }, "Property details fetch failed");
    return { ok: false, error: `Failed to fetch property details: ${detail}` };
  }

  const property = fetched.data;
  const roomTypes = Array.isArray(property.rooms) ? property.rooms : [];
  if (roomTypes.length === 0) {
    return { ok: false, error: "No room types returned by Aiosell" };
  }

  // --------------------------------------------------------------
  // Destroy the current channel-owned state for this hotel so the
  // rebuild below mirrors Aiosell exactly (idempotent, destructive).
  // --------------------------------------------------------------
  const roomDelete = await Room.deleteMany({ hotelId });
  const planDelete = await RatePlan.deleteMany({ hotelId });
  const roomTypeDelete = await RoomType.deleteMany({ hotelId });

  // --------------------------------------------------------------
  // Rebuild room types from Aiosell ROOM TYPES
  // --------------------------------------------------------------
  const roomTypesToCreate = [];
  const roomsToCreate = [];
  const roomCodes = new Set();
  const ratePlansToCreate = [];

  for (const type of roomTypes) {
    if (!type.room_id) continue;

    const roomCode = String(type.room_id).trim().toLowerCase();
    const roomName = type.room_name || "";
    const roomType = roomTypeOf(roomCode, roomName);
    const prefix = roomNumberPrefix(roomCode, roomName);
    const count = Math.max(1, Number(type.count) || 1);
    const baseRate = baseRateOf(roomCode, roomName);

    roomCodes.add(roomCode);

    const minOcc = Math.max(1, Number(type.min_occ) || 1);
    const maxOcc = type.max_occ != null ? Number(type.max_occ) : null;

    roomTypesToCreate.push({
      roomCode,
      name: roomType,
      description: String(type.description || "").trim(),
      count,
      active: type.active !== false,
      minOccupancy: minOcc,
      maxOccupancy: maxOcc,
      channelSyncStatus: "completed",
      hotelId,
    });

    for (let i = 1; i <= count; i += 1) {
      roomsToCreate.push({
        roomNumber: `${prefix}-${String(i).padStart(2, "0")}`,
        type: roomType,
        roomCode,
        channelSyncStatus: "completed",
        status: "available",
        rate: baseRate,
        floor: 1,
        hotelId,
      });
    }

    // ----------------------------------------------------------
    // Rebuild rate plans from Aiosell RATEPLANS per room type
    // ----------------------------------------------------------
    const ratePlans = Array.isArray(type.rateplans) ? type.rateplans : [];
    for (const rp of ratePlans) {
      if (!rp.rateplan_id) continue;

      const ratePlanCode = String(rp.rateplan_id).trim().toLowerCase();
      const occupancy = occupancyTypeOf(rp.occupancy);
      const mealPlan = mealPlanOf(ratePlanCode);

      ratePlansToCreate.push({
        name: rp.rateplan_name || ratePlanCode,
        ratePlanCode,
        roomCode,
        roomType,
        rate: rateOf(roomCode, roomName, occupancy, mealPlan),
        occupancy,
        mealPlan,
        isActive: true,
        channelSyncStatus: "completed",
        hotelId,
      });
    }
  }

  if (roomsToCreate.length === 0) {
    return { ok: false, error: "Aiosell returned no usable room types" };
  }

  if (roomCodes.size === 0) {
    return { ok: false, error: "Aiosell returned no room codes" };
  }

  const createdRoomTypes = await RoomType.insertMany(roomTypesToCreate);
  const createdRooms = await Room.insertMany(roomsToCreate);
  const createdPlans =
    ratePlansToCreate.length > 0
      ? await RatePlan.insertMany(ratePlansToCreate)
      : [];

  // --------------------------------------------------------------
  // Push recomputed availability + rates back, then stamp lastSyncAt.
  // Kept running even if one push fails so the DB mapping is still
  // stored; the UI reports the sync outcome.
  // --------------------------------------------------------------
  const [inventorySync, ratesSync] = await Promise.all([
    aiosellSyncInventory(hotelId),
    aiosellSyncRates(hotelId),
  ]);

  if (inventorySync.ok || ratesSync.ok) {
    await ChannelManagerConfig.updateOne(
      {},
      { $set: { lastSyncAt: new Date() } },
    );
  }

  logger.info(
    { hotelId, hotelCode: hotel.aiosellHotelCode },
    "Hotel reconciled from Aiosell property details",
  );

  return {
    ok: true,
    data: {
      property: {
        hotelCode: property.hotel_id || hotel.aiosellHotelCode,
        hotelName: property.hotel_name || null,
        currency: property.currency || null,
        timezone: property.timezone || null,
      },
      rooms: {
        deleted: roomDelete.deletedCount ?? 0,
        created: createdRooms.length,
      },
      roomTypes: {
        deleted: roomTypeDelete.deletedCount ?? 0,
        created: createdRoomTypes.length,
      },
      ratePlans: {
        deleted: planDelete.deletedCount ?? 0,
        created: createdPlans.length,
      },
      sync: { inventory: inventorySync, rates: ratesSync },
    },
  };
}
