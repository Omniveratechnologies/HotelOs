import Room from "#/modules/rooms/models/Room.js";
import Booking from "#/modules/bookings/models/Booking.js";
import RatePlan from "#/modules/rate-plans/models/RatePlan.js";
import Hotel from "#/modules/hotels/models/Hotel.js";
import aiosell from "#/shared/services/aiosell.service.js";
import logger from "#/utils/logger.js";

// Date-based availability and rate calculation, bridging HotelOS models to
// Aiosell payloads. Uses UTC dates throughout ("YYYY-MM-DD" strings parsed as
// UTC midnight) so night boundaries stay consistent across timezones.

function datesInRange(start, end) {
  const dates = [];
  const current = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (current <= last) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

function defaultDateRange(startDate, endDate) {
  const start = startDate || new Date().toISOString().slice(0, 10);
  const end =
    endDate ||
    (() => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() + 30);
      return d.toISOString().slice(0, 10);
    })();
  return [start, end];
}

export async function aiosellCalculateAvailability(
  hotelId,
  startDate,
  endDate,
) {
  const rooms = await Room.find({ hotelId, roomCode: { $ne: null } });
  const dates = datesInRange(startDate, endDate);

  const roomTypeCounts = {};
  for (const room of rooms) {
    roomTypeCounts[room.roomCode] = (roomTypeCounts[room.roomCode] || 0) + 1;
  }

  const activeBookings = await Booking.find({
    hotelId,
    status: { $in: ["reserved", "checked-in"] },
    checkIn: { $lte: new Date(`${endDate}T00:00:00Z`) },
    checkOut: { $gte: new Date(`${startDate}T00:00:00Z`) },
  }).populate("roomId", "roomCode");

  const availability = {};
  for (const date of dates) {
    const d = new Date(`${date}T00:00:00Z`);
    availability[date] = {};

    for (const [roomCode, totalCount] of Object.entries(roomTypeCounts)) {
      let occupiedCount = 0;
      for (const booking of activeBookings) {
        if (booking.roomId?.roomCode === roomCode) {
          const checkIn = new Date(booking.checkIn);
          const checkOut = new Date(booking.checkOut);
          if (d >= checkIn && d < checkOut) {
            occupiedCount++;
          }
        }
      }

      availability[date][roomCode] = Math.max(0, totalCount - occupiedCount);
    }
  }

  return availability;
}

export async function aiosellBuildInventoryPayload(
  hotelId,
  startDate,
  endDate,
) {
  const availability = await aiosellCalculateAvailability(
    hotelId,
    startDate,
    endDate,
  );
  const dates = Object.keys(availability).sort();

  if (dates.length === 0) return null;

  const roomsMap = {};
  for (const date of dates) {
    for (const [roomCode, available] of Object.entries(availability[date])) {
      if (!roomsMap[roomCode]) roomsMap[roomCode] = {};
      roomsMap[roomCode][date] = available;
    }
  }

  // One block per roomCode covering the full date range. Aiosell applies the
  // count to every date in the range, so use the MIN availability across the
  // range to guarantee we never oversell.
  const rooms = Object.entries(roomsMap).map(([roomCode, dateAvail]) => ({
    roomCode,
    available: Math.min(...Object.values(dateAvail)),
  }));

  return {
    updates: [{ startDate, endDate, rooms }],
  };
}

export async function aiosellBuildRatePayload(hotelId, startDate, endDate) {
  const ratePlans = await RatePlan.find({ hotelId, isActive: true });
  if (ratePlans.length === 0) return null;

  const rates = ratePlans.map((rp) => ({
    roomCode: rp.roomCode,
    rate: rp.rate,
    rateplanCode: rp.ratePlanCode,
  }));

  return {
    updates: [{ startDate, endDate, rates }],
  };
}

export async function aiosellSyncInventory(hotelId, startDate, endDate) {
  try {
    const hotel = await Hotel.findById(hotelId).select("aiosellHotelCode");
    if (!hotel?.aiosellHotelCode) {
      logger.warn(
        { hotelId },
        "Aiosell sync skipped — hotel has no aiosellHotelCode",
      );
      return { ok: false, error: "Hotel is not mapped to an Aiosell property" };
    }

    const [start, end] = defaultDateRange(startDate, endDate);
    const payload = await aiosellBuildInventoryPayload(hotelId, start, end);
    if (!payload) {
      return {
        ok: false,
        error: "No inventory to push (no rooms with roomCode)",
      };
    }

    const result = await aiosell.pushInventory(
      hotel.aiosellHotelCode,
      payload.updates,
    );
    if (result.ok) {
      logger.info(
        { hotelId, hotelCode: hotel.aiosellHotelCode },
        "Inventory synced to Aiosell",
      );
    }
    return result;
  } catch (error) {
    logger.error(error, "Failed to sync inventory to Aiosell");
    return { ok: false, error: error.message };
  }
}

export async function aiosellSyncRates(hotelId, startDate, endDate) {
  try {
    const hotel = await Hotel.findById(hotelId).select("aiosellHotelCode");
    if (!hotel?.aiosellHotelCode) {
      logger.warn(
        { hotelId },
        "Aiosell sync skipped — hotel has no aiosellHotelCode",
      );
      return { ok: false, error: "Hotel is not mapped to an Aiosell property" };
    }

    const [start, end] = defaultDateRange(startDate, endDate);
    const payload = await aiosellBuildRatePayload(hotelId, start, end);
    if (!payload) {
      return { ok: false, error: "No rate plans to push" };
    }

    const result = await aiosell.pushRates(
      hotel.aiosellHotelCode,
      payload.updates,
    );
    if (result.ok) {
      logger.info(
        { hotelId, hotelCode: hotel.aiosellHotelCode },
        "Rates synced to Aiosell",
      );
    }
    return result;
  } catch (error) {
    logger.error(error, "Failed to sync rates to Aiosell");
    return { ok: false, error: error.message };
  }
}
