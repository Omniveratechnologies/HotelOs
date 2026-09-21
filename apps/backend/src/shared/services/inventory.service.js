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
  const startMs = new Date(`${start}T00:00:00Z`).getTime();
  const endMs = new Date(`${end}T00:00:00Z`).getTime();
  for (let ms = startMs; ms <= endMs; ms += 86400000) {
    dates.push(new Date(ms).toISOString().slice(0, 10));
  }
  return dates;
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function validateAndNormalizeDateRange(startDate, endDate) {
  const today = new Date().toISOString().slice(0, 10);
  const start = startDate ? String(startDate).trim() : today;
  let end = endDate ? String(endDate).trim() : null;

  if (!end) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 30);
    end = d.toISOString().slice(0, 10);
  }

  if (!ISO_DATE_REGEX.test(start)) {
    throw new Error(
      `Invalid startDate format: "${start}". Expected YYYY-MM-DD.`,
    );
  }

  if (!ISO_DATE_REGEX.test(end)) {
    throw new Error(`Invalid endDate format: "${end}". Expected YYYY-MM-DD.`);
  }

  if (start > end) {
    throw new Error(`startDate (${start}) cannot be after endDate (${end}).`);
  }

  return [start, end];
}

function defaultDateRange(startDate, endDate) {
  return validateAndNormalizeDateRange(startDate, endDate);
}

export function calculateSyncDateRange(checkIn, checkOut, baseDays = 30) {
  const today = new Date().toISOString().slice(0, 10);
  const defaultEndDate = new Date();
  defaultEndDate.setUTCDate(defaultEndDate.getUTCDate() + baseDays);
  const defaultEnd = defaultEndDate.toISOString().slice(0, 10);

  let checkInStr = null;
  if (checkIn) {
    checkInStr = new Date(checkIn).toISOString().slice(0, 10);
  }

  let checkOutStr = null;
  if (checkOut) {
    checkOutStr = new Date(checkOut).toISOString().slice(0, 10);
  }

  // If check-in falls within or overlaps near-term default window:
  // sync from min(today, checkIn) to max(defaultEnd, checkOut)
  if (!checkInStr || checkInStr <= defaultEnd) {
    const start = checkInStr && checkInStr < today ? checkInStr : today;
    const end =
      checkOutStr && checkOutStr > defaultEnd ? checkOutStr : defaultEnd;
    return [start, end];
  }

  // If booking is beyond the 30-day window, sync the booking's exact dates
  return [checkInStr, checkOutStr || checkInStr];
}

export async function aiosellCalculateAvailability(
  hotelId,
  startDate,
  endDate,
) {
  // Only approved codes are pushed — codes still "under_review" don't exist
  // in Aiosell yet (super admin must create them manually and approve).
  // Exclude rooms pending deletion.
  const rooms = await Room.find({
    hotelId,
    roomCode: { $ne: null },
    channelSyncStatus: "completed",
    pendingDelete: { $ne: true },
  });
  const dates = datesInRange(startDate, endDate);

  const roomTypeCounts = {};
  for (const room of rooms) {
    roomTypeCounts[room.roomCode] = (roomTypeCounts[room.roomCode] || 0) + 1;
  }

  const activeBookings = await Booking.find({
    hotelId,
    status: { $in: ["reserved", "checked-in"] },
    checkIn: { $lte: new Date(`${endDate}T23:59:59.999Z`) },
    checkOut: { $gt: new Date(`${startDate}T00:00:00.000Z`) },
  }).populate("roomId", "roomCode");

  // Pre-normalize booking dates to ISO YYYY-MM-DD strings for fast, exact night comparisons
  const normalizedBookings = activeBookings
    .filter((b) => b.roomId?.roomCode && b.checkIn && b.checkOut)
    .map((b) => ({
      roomCode: b.roomId.roomCode,
      checkInDate: new Date(b.checkIn).toISOString().slice(0, 10),
      checkOutDate: new Date(b.checkOut).toISOString().slice(0, 10),
    }));

  const availability = {};
  for (const date of dates) {
    availability[date] = {};

    for (const [roomCode, totalCount] of Object.entries(roomTypeCounts)) {
      let occupiedCount = 0;
      for (const booking of normalizedBookings) {
        if (
          booking.roomCode === roomCode &&
          date >= booking.checkInDate &&
          date < booking.checkOutDate
        ) {
          occupiedCount++;
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
  const dates = Object.keys(availability).toSorted();

  if (dates.length === 0) return null;

  const roomsMap = {};
  for (const date of dates) {
    for (const [roomCode, available] of Object.entries(availability[date])) {
      if (!roomsMap[roomCode]) roomsMap[roomCode] = {};
      roomsMap[roomCode][date] = available;
    }
  }

  // Generate date-by-date blocks so each date reflects exact available inventory
  const updates = [];
  for (const date of dates) {
    const rooms = Object.entries(availability[date] || {}).map(
      ([roomCode, available]) => ({
        roomCode,
        available,
      }),
    );
    if (rooms.length > 0) {
      updates.push({ startDate: date, endDate: date, rooms });
    }
  }

  return updates.length > 0 ? { updates } : null;
}

export async function aiosellBuildRatePayload(hotelId, startDate, endDate) {
  const ratePlans = await RatePlan.find({
    hotelId,
    isActive: true,
    channelSyncStatus: "completed",
  });
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
