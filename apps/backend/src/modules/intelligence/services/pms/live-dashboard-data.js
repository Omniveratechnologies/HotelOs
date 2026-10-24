// Live MongoDB adapter for the Omni PMS database.
//
// This file reads the REAL operational Omni collections:
//   bookings, bills, payments, rooms, roomtypes
//
// It converts those records into the normalized raw structure expected by
// dashboard-shape.computeDashboardPayload().
//
// The dashboard-shape layer remains responsible for the final calculations
// and frontend response format.

import mongoose from "mongoose";
import { assertKnownDashboard } from "#/modules/intelligence/lib/pms/intelligence-data.js";
import {
  computeWindows,
  computeDashboardPayload,
} from "#/modules/intelligence/lib/pms/dashboard-shape.js";
import {
  forecastSeries,
  deriveRevpar,
} from "#/modules/intelligence/lib/pms/forecasting.js";

function asDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function clampDateRange(date, start, end) {
  if (!date) return false;
  return date >= start && date < end;
}

function dateOnlyUTC(date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + amount);
  return result;
}

function diffNights(checkIn, checkOut) {
  const start = asDate(checkIn);
  const end = asDate(checkOut);

  if (!start || !end) return 1;

  const milliseconds = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(milliseconds / 86400000));
}

function money(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function safeString(value, fallback = "Unknown") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function normalizeStatus(status) {
  return safeString(status, "unknown").toLowerCase().trim();
}

function isCancelledBooking(booking) {
  const status = normalizeStatus(booking.status);

  return (
    status === "cancelled" ||
    status === "canceled" ||
    status === "no_show" ||
    status === "no-show"
  );
}

function isActiveBooking(booking) {
  return !isCancelledBooking(booking);
}

function bookingNights(booking) {
  return diffNights(booking.checkIn, booking.checkOut);
}

function bookingRevenue(booking) {
  /*
   * Omni's booking records contain totalAmountBeforeTax.
   * Some records may not have it, so fall back to zero rather than inventing
   * a room price.
   */
  return money(booking.totalAmountBeforeTax);
}

function bookingRoomType(booking) {
  return safeString(
    booking.roomTypeCode || booking.roomType || booking.roomCode || "Unknown",
  );
}

function bookingSource(booking) {
  return safeString(booking.source || booking.channel || "Unknown");
}

function paymentMethod(payment) {
  return safeString(payment.method, "Unknown");
}

function getDayKey(date) {
  const d = asDate(date);
  if (!d) return null;

  return d.toISOString().slice(0, 10);
}

function makeDailyMap(start, end) {
  const map = new Map();

  let current = dateOnlyUTC(start);
  const final = dateOnlyUTC(end);

  while (current < final) {
    const key = getDayKey(current);

    map.set(key, {
      date: new Date(current),
      totalRevenue: 0,
      roomRevenue: 0,
      servicesRevenue: 0,
      foodBeverageRevenue: 0,
      miscellaneousRevenue: 0,
      bookings: 0,
      roomNights: 0,
      occupiedRooms: 0,
      availableRooms: 0,
      paidRevenue: 0,
    });

    current = addDays(current, 1);
  }

  return map;
}

function addBookingToDailyMap(map, booking) {
  if (!isActiveBooking(booking)) return;

  const checkIn = asDate(booking.checkIn);
  const checkOut = asDate(booking.checkOut);

  if (!checkIn || !checkOut) return;

  const nights = bookingNights(booking);
  const revenue = bookingRevenue(booking);
  const revenuePerNight = revenue / nights;

  /*
   * Booking count is attributed to the check-in date.
   */
  const bookingDay = getDayKey(checkIn);

  if (map.has(bookingDay)) {
    const row = map.get(bookingDay);

    row.bookings += 1;
    row.roomNights += nights;
  }

  /*
   * Revenue is distributed across the stay dates.
   * This is more useful for ADR/RevPAR than putting the whole booking
   * amount on check-in day.
   */
  for (let i = 0; i < nights; i += 1) {
    const stayDate = addDays(dateOnlyUTC(checkIn), i);
    const key = getDayKey(stayDate);

    if (!map.has(key)) continue;

    const row = map.get(key);

    row.roomRevenue += revenuePerNight;
    row.totalRevenue += revenuePerNight;
    row.occupiedRooms += 1;
  }
}

function addBillToDailyMap(map, bill) {
  const date = asDate(bill.updatedAt) || asDate(bill.createdAt);

  if (!date) return;

  const key = getDayKey(date);

  if (!map.has(key)) return;

  const row = map.get(key);

  const total = money(bill.totalAmount);

  /*
   * Bills can represent food/takeaway/room charges.
   * We use the bill type to separate F&B from miscellaneous revenue.
   */
  const type = safeString(bill.billType, "").toLowerCase();

  if (
    type.includes("food") ||
    type.includes("restaurant") ||
    type.includes("takeaway") ||
    type.includes("f&b") ||
    type.includes("fb")
  ) {
    row.foodBeverageRevenue += total;
  } else {
    row.servicesRevenue += total;
  }

  row.totalRevenue += total;
}

function addPaymentToDailyMap(map, payment) {
  if (normalizeStatus(payment.status) !== "success") return;

  const date = asDate(payment.createdAt);
  if (!date) return;

  const key = getDayKey(date);

  if (!map.has(key)) return;

  map.get(key).paidRevenue += money(payment.amount);
}

function dailyRowsFromMap(map) {
  return [...map.values()]
    .sort((a, b) => a.date - b.date)
    .map((row) => ({
      _id: row.date,
      total: row.totalRevenue,
      room: row.roomRevenue,
      services: row.servicesRevenue,
      foodBeverage: row.foodBeverageRevenue,
      miscellaneous: row.miscellaneousRevenue,
      bookings: row.bookings,
      roomNights: row.roomNights,
    }));
}

function occupancyRowsFromMap(map, totalRooms) {
  return [...map.values()]
    .sort((a, b) => a.date - b.date)
    .map((row) => ({
      _id: row.date,
      occupied: row.occupiedRooms,
      available: totalRooms,
      occupancyPct: totalRooms > 0 ? (row.occupiedRooms / totalRooms) * 100 : 0,
    }));
}

function adrRowsFromMap(map) {
  return [...map.values()]
    .sort((a, b) => a.date - b.date)
    .map((row) => ({
      _id: row.date,
      roomRevenue: row.roomRevenue,
      roomNightsSold: row.roomNights,
    }));
}

function buildBookingDays(bookings, start, end) {
  const map = new Map();

  let current = dateOnlyUTC(start);
  const final = dateOnlyUTC(end);

  while (current < final) {
    map.set(getDayKey(current), {
      date: new Date(current),
      statuses: new Map(),
      guests: 0,
    });

    current = addDays(current, 1);
  }

  for (const booking of bookings) {
    const createdAt = asDate(booking.createdAt);

    if (!createdAt || !clampDateRange(createdAt, start, end)) {
      continue;
    }

    const key = getDayKey(createdAt);

    if (!map.has(key)) continue;

    const row = map.get(key);

    const status = safeString(booking.status, "unknown");

    row.statuses.set(status, (row.statuses.get(status) || 0) + 1);

    row.guests += money(booking.adults) + money(booking.children);
  }

  return [...map.values()].flatMap((row) => {
    const statuses = [...row.statuses.entries()].map(([status, count]) => ({
      _id: {
        date: row.date,
        status,
      },
      count,
      guests: 0,
    }));

    return statuses.length
      ? statuses
      : [
          {
            _id: {
              date: row.date,
              status: "none",
            },
            count: 0,
            guests: row.guests,
          },
        ];
  });
}

function buildRoomTypeRows(bookings, selectedStart, end) {
  const groups = new Map();

  for (const booking of bookings) {
    const checkIn = asDate(booking.checkIn);

    if (!checkIn || !clampDateRange(checkIn, selectedStart, end)) {
      continue;
    }

    const type = bookingRoomType(booking);

    if (!groups.has(type)) {
      groups.set(type, {
        count: 0,
        amount: 0,
        cancellations: 0,
        nights: 0,
      });
    }

    const row = groups.get(type);

    row.count += 1;

    if (isCancelledBooking(booking)) {
      row.cancellations += 1;
      continue;
    }

    row.amount += bookingRevenue(booking);
    row.nights += bookingNights(booking);
  }

  return [...groups.entries()]
    .map(([roomType, row]) => ({
      _id: roomType,
      ...row,
    }))
    .sort((a, b) => b.amount - a.amount);
}

function buildSourceRows(bookings, selectedStart, end) {
  const groups = new Map();

  for (const booking of bookings) {
    const checkIn = asDate(booking.checkIn);

    if (!checkIn || !clampDateRange(checkIn, selectedStart, end)) {
      continue;
    }

    const source = bookingSource(booking);

    if (!groups.has(source)) {
      groups.set(source, {
        count: 0,
        amount: 0,
        nights: 0,
      });
    }

    const row = groups.get(source);

    row.count += 1;

    if (!isCancelledBooking(booking)) {
      row.amount += bookingRevenue(booking);
      row.nights += bookingNights(booking);
    }
  }

  return [...groups.entries()]
    .map(([source, row]) => ({
      _id: source,
      ...row,
    }))
    .sort((a, b) => b.count - a.count);
}

function buildPaymentRows(payments, start, end) {
  const groups = new Map();

  for (const payment of payments) {
    const createdAt = asDate(payment.createdAt);

    if (
      !createdAt ||
      !clampDateRange(createdAt, start, end) ||
      normalizeStatus(payment.status) !== "success"
    ) {
      continue;
    }

    const method = paymentMethod(payment);

    if (!groups.has(method)) {
      groups.set(method, {
        count: 0,
        amount: 0,
      });
    }

    const row = groups.get(method);

    row.count += 1;
    row.amount += money(payment.amount);
  }

  return [...groups.entries()]
    .map(([method, row]) => ({
      _id: method,
      ...row,
    }))
    .sort((a, b) => b.amount - a.amount);
}

function buildWeekdayRows(bookings, selectedStart, end) {
  const groups = new Map();

  for (const booking of bookings) {
    const checkIn = asDate(booking.checkIn);

    if (
      !checkIn ||
      !clampDateRange(checkIn, selectedStart, end) ||
      isCancelledBooking(booking)
    ) {
      continue;
    }

    /*
     * MongoDB $dayOfWeek:
     * Sunday=1 ... Saturday=7
     */
    const day = checkIn.getUTCDay() + 1;

    if (!groups.has(day)) {
      groups.set(day, {
        count: 0,
        roomRevenue: 0,
        roomNights: 0,
      });
    }

    const row = groups.get(day);

    row.count += 1;
    row.roomRevenue += bookingRevenue(booking);
    row.roomNights += bookingNights(booking);
  }

  return [...groups.entries()].map(([day, row]) => ({
    _id: {
      day,
    },
    ...row,
  }));
}

function buildBookingLeadRows(bookings, selectedStart, end) {
  const groups = new Map();

  for (const booking of bookings) {
    const createdAt = asDate(booking.createdAt);
    const checkIn = asDate(booking.checkIn);

    if (
      !createdAt ||
      !checkIn ||
      !clampDateRange(checkIn, selectedStart, end)
    ) {
      continue;
    }

    const days = Math.max(
      0,
      Math.floor((checkIn.getTime() - createdAt.getTime()) / 86400000),
    );

    let bucket = ">60 days";

    if (days <= 0) bucket = "Same day";
    else if (days <= 7) bucket = "1–7 days";
    else if (days <= 30) bucket = "8–30 days";
    else if (days <= 60) bucket = "31–60 days";

    groups.set(bucket, (groups.get(bucket) || 0) + 1);
  }

  return [...groups.entries()].map(([bucket, count]) => ({
    _id: bucket,
    count,
  }));
}

function buildPurposeRows(bookings, selectedStart, end) {
  const groups = new Map();

  for (const booking of bookings) {
    const checkIn = asDate(booking.checkIn);

    if (!checkIn || !clampDateRange(checkIn, selectedStart, end)) {
      continue;
    }

    const purpose = safeString(
      booking.purposeOfVisit || booking.purpose || "Unknown",
    );

    groups.set(purpose, (groups.get(purpose) || 0) + 1);
  }

  return [...groups.entries()]
    .map(([purpose, count]) => ({
      _id: purpose,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

function buildStayDurationRows(bookings, selectedStart, end) {
  const groups = new Map();

  for (const booking of bookings) {
    const checkIn = asDate(booking.checkIn);

    if (!checkIn || !clampDateRange(checkIn, selectedStart, end)) {
      continue;
    }

    const nights = bookingNights(booking);

    let bucket;

    if (nights <= 1) bucket = "1 night";
    else if (nights <= 2) bucket = "2 nights";
    else if (nights <= 3) bucket = "3 nights";
    else if (nights <= 7) bucket = "4–7 nights";
    else bucket = ">7 nights";

    groups.set(bucket, (groups.get(bucket) || 0) + 1);
  }

  return [...groups.entries()].map(([bucket, count]) => ({
    _id: bucket,
    count,
  }));
}

function buildCancellationRows(bookings, start, end) {
  const groups = new Map();

  for (const booking of bookings) {
    if (!isCancelledBooking(booking)) continue;

    const date = asDate(booking.cancelledAt) || asDate(booking.updatedAt);

    if (!date || !clampDateRange(date, start, end)) {
      continue;
    }

    const key = getDayKey(date);

    if (!groups.has(key)) {
      groups.set(key, {
        date,
        count: 0,
        amount: 0,
        roomNights: 0,
        leadDays: [],
      });
    }

    const row = groups.get(key);

    row.count += 1;
    row.amount += money(booking.totalAmountBeforeTax) || money(booking.amount);

    row.roomNights += bookingNights(booking);

    const checkIn = asDate(booking.checkIn);

    if (checkIn) {
      row.leadDays.push(
        Math.max(
          0,
          Math.floor((checkIn.getTime() - date.getTime()) / 86400000),
        ),
      );
    }
  }

  return [...groups.values()]
    .sort((a, b) => a.date - b.date)
    .map((row) => ({
      _id: {
        date: row.date,
      },
      count: row.count,
      amount: row.amount,
      roomNights: row.roomNights,
      avgDaysBeforeCancel: row.leadDays.length
        ? row.leadDays.reduce((a, b) => a + b, 0) / row.leadDays.length
        : 0,
    }));
}

function buildCancellationSourceRows(bookings, start, end) {
  const groups = new Map();

  for (const booking of bookings) {
    if (!isCancelledBooking(booking)) continue;

    const date = asDate(booking.cancelledAt) || asDate(booking.updatedAt);

    if (!date || !clampDateRange(date, start, end)) {
      continue;
    }

    const source = bookingSource(booking);

    groups.set(source, (groups.get(source) || 0) + 1);
  }

  return [...groups.entries()]
    .map(([source, count]) => ({
      _id: source,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

function buildCancellationLeadRows(bookings, start, end) {
  const groups = new Map();

  for (const booking of bookings) {
    if (!isCancelledBooking(booking)) continue;

    const cancelledAt =
      asDate(booking.cancelledAt) || asDate(booking.updatedAt);

    const checkIn = asDate(booking.checkIn);

    if (!cancelledAt || !checkIn || !clampDateRange(cancelledAt, start, end)) {
      continue;
    }

    const days = Math.max(
      0,
      Math.floor((checkIn.getTime() - cancelledAt.getTime()) / 86400000),
    );

    let bucket = ">60 days";

    if (days <= 0) bucket = "Same day";
    else if (days <= 7) bucket = "1–7 days";
    else if (days <= 30) bucket = "8–30 days";
    else if (days <= 60) bucket = "31–60 days";

    groups.set(bucket, (groups.get(bucket) || 0) + 1);
  }

  return [...groups.entries()].map(([bucket, count]) => ({
    _id: bucket,
    count,
  }));
}

function buildCancellationReasonRows(bookings, start, end) {
  const groups = new Map();

  for (const booking of bookings) {
    if (!isCancelledBooking(booking)) continue;

    const date = asDate(booking.cancelledAt) || asDate(booking.updatedAt);

    if (!date || !clampDateRange(date, start, end)) {
      continue;
    }

    const reason = safeString(
      booking.cancellationReason || booking.cancelReason || "Unknown",
    );

    if (!groups.has(reason)) {
      groups.set(reason, {
        count: 0,
        revenueLost: 0,
      });
    }

    const row = groups.get(reason);

    row.count += 1;
    row.revenueLost +=
      money(booking.totalAmountBeforeTax) || money(booking.amount);
  }

  return [...groups.entries()]
    .map(([reason, row]) => ({
      _id: reason,
      ...row,
    }))
    .sort((a, b) => b.count - a.count);
}

function buildRoomTypeHeatmap(bookings, start, end) {
  const groups = new Map();

  for (const booking of bookings) {
    if (!isActiveBooking(booking)) continue;

    const checkIn = asDate(booking.checkIn);

    if (!checkIn || !clampDateRange(checkIn, start, end)) {
      continue;
    }

    const roomType = bookingRoomType(booking);
    const day = checkIn.getUTCDay() + 1;

    const key = `${roomType}::${day}`;

    if (!groups.has(key)) {
      groups.set(key, {
        roomType,
        day,
        roomRevenue: 0,
        roomNights: 0,
      });
    }

    const row = groups.get(key);

    row.roomRevenue += bookingRevenue(booking);
    row.roomNights += bookingNights(booking);
  }

  return [...groups.values()].map((row) => ({
    _id: {
      roomType: row.roomType,
      day: row.day,
    },
    roomRevenue: row.roomRevenue,
    roomNights: row.roomNights,
  }));
}

function buildOccupancyDetailRows(bookings, start, end) {
  const groups = new Map();

  for (const booking of bookings) {
    if (!isActiveBooking(booking)) continue;

    const checkIn = asDate(booking.checkIn);
    const checkOut = asDate(booking.checkOut);

    if (!checkIn || !checkOut) continue;

    const nights = bookingNights(booking);

    for (let i = 0; i < nights; i += 1) {
      const stayDate = addDays(dateOnlyUTC(checkIn), i);

      if (!clampDateRange(stayDate, start, end)) {
        continue;
      }

      const key = getDayKey(stayDate);

      const roomType = bookingRoomType(booking);

      const groupKey = `${key}::${roomType}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          date: stayDate,
          roomType,
          occupied: 0,
        });
      }

      groups.get(groupKey).occupied += 1;
    }
  }

  return [...groups.values()].map((row) => ({
    _id: {
      date: row.date,
      roomType: row.roomType,
    },
    occupied: row.occupied,
  }));
}

function buildNationalityRows(bookings) {
  /*
   * The current Omni booking records do not expose nationality in the
   * operational booking document. Do not invent nationality.
   *
   * Return an empty set so dashboard-shape can safely handle unavailable
   * demographics.
   */
  void bookings;
  return [];
}

function buildCityRows(bookings) {
  /*
   * Same principle as nationality: only return data actually available from
   * the operational records.
   */
  void bookings;
  return [];
}

function buildGuestAgeRows() {
  /*
   * The current Omni operational data available to this adapter does not
   * provide dateOfBirth. Do not manufacture age groups.
   */
  return [];
}

function buildRepeatGuestRows(bookings) {
  const guests = new Map();

  for (const booking of bookings) {
    if (!isActiveBooking(booking)) continue;

    const guestId = booking.guestId?.toString?.() || booking.guestId;

    if (!guestId) continue;

    guests.set(guestId, (guests.get(guestId) || 0) + 1);
  }

  let returning = 0;

  for (const count of guests.values()) {
    if (count >= 2) returning += 1;
  }

  const total = guests.size;

  return [
    {
      _id: null,
      total,
      returning,
      averageBookings:
        total > 0
          ? [...guests.values()].reduce((sum, value) => sum + value, 0) / total
          : 0,
    },
  ];
}

function buildGuestCohortRows(bookings) {
  /*
   * Guest cohort requires guest registration/source fields that are not
   * present in the current operational booking data.
   */
  void bookings;
  return [];
}

function buildRawOccupancyRows(bookings, start, end) {
  const rows = [];

  for (const booking of bookings) {
    if (!isActiveBooking(booking)) continue;

    const checkIn = asDate(booking.checkIn);
    const checkOut = asDate(booking.checkOut);

    if (!checkIn || !checkOut) continue;

    const nights = bookingNights(booking);

    for (let i = 0; i < nights; i += 1) {
      const date = addDays(dateOnlyUTC(checkIn), i);

      if (!clampDateRange(date, start, end)) continue;

      rows.push({
        _id: {
          date,
          roomType: bookingRoomType(booking),
        },
        occupied: 1,
      });
    }
  }

  return rows;
}

function buildForecastRows(dailyRows, totalRooms, horizon) {
  const revenueHistory = dailyRows.map((row) => money(row.total));

  const occupancyHistory = dailyRows.map((row) =>
    totalRooms > 0 ? (money(row.roomNights) / totalRooms) * 100 : 0,
  );

  const adrHistory = dailyRows.map((row) =>
    money(row.roomNights) > 0 ? money(row.room) / money(row.roomNights) : 0,
  );

  const bookingHistory = dailyRows.map((row) => money(row.bookings));

  const revenue = forecastSeries(revenueHistory, horizon, { min: 0 });

  const occupancy = forecastSeries(occupancyHistory, horizon, {
    min: 0,
    max: 100,
  });

  const adr = forecastSeries(adrHistory, horizon, { min: 0 });

  const bookings = forecastSeries(bookingHistory, horizon, { min: 0 });

  const revpar = deriveRevpar(adr, occupancy);

  const forecasts = [];

  const models = {
    revenue,
    occupancy,
    adr,
    bookings,
    revpar,
  };

  const baseDate = dailyRows.length
    ? dateOnlyUTC(asDate(dailyRows[dailyRows.length - 1]._id))
    : dateOnlyUTC(new Date());

  for (let i = 0; i < horizon; i += 1) {
    const date = addDays(baseDate, i + 1);

    for (const [metric, result] of Object.entries(models)) {
      forecasts.push({
        _id: {
          metric,
          date,
        },
        value: money(result.predicted[i]),
        lower: money(result.lower[i]),
        upper: money(result.upper[i]),
        modelVersion: result.model,
        generatedAt: new Date(),
      });
    }
  }

  return forecasts;
}

export async function queryLiveDashboardData(id, range, hotelIdValue) {
  assertKnownDashboard(id);

  if (!process.env.MONGODB_URI) {
    const error = new Error("MONGODB_URI is not configured.");

    error.status = 503;
    throw error;
  }

  if (!mongoose.isValidObjectId(hotelIdValue)) {
    const error = new Error(
      "No valid hotelId was provided by the authenticated session.",
    );

    error.status = 400;
    throw error;
  }

  /*
   * We deliberately use the native MongoDB collections here rather than
   * src/lib/schemas.js because those schemas describe the old intelligence
   * data model, not the actual Omni operational collections.
   */
  const db = mongoose.connection.db;

  if (!db) {
    const error = new Error("MongoDB connection is not available.");

    error.status = 503;
    throw error;
  }

  const hotelId = new mongoose.Types.ObjectId(hotelIdValue);

  const { days, end, selectedStart, queryStart, futureEnd } =
    computeWindows(range);

  /*
   * We need enough historical data for forecasting.
   *
   * queryStart is normally the comparison-window beginning.
   * For forecasting we use all available rows returned by this range.
   */
  const [bookings, bills, payments, rooms] = await Promise.all([
    db.collection("bookings").find({ hotelId }).toArray(),

    db.collection("bills").find({ hotelId }).toArray(),

    db
      .collection("payments")
      .find({
        hotelId,
        status: "success",
      })
      .toArray(),

    db
      .collection("rooms")
      .find({
        hotelId,
        status: {
          $ne: "out_of_order",
        },
      })
      .toArray(),
  ]);

  const totalRooms = rooms.length;

  /*
   * Daily operational data.
   */
  const dailyMap = makeDailyMap(queryStart, end);

  for (const booking of bookings) {
    addBookingToDailyMap(dailyMap, booking);
  }

  for (const bill of bills) {
    addBillToDailyMap(dailyMap, bill);
  }

  for (const payment of payments) {
    addPaymentToDailyMap(dailyMap, payment);
  }

  const dailyRows = dailyRowsFromMap(dailyMap);

  const rollups = dailyRows;

  const invoiceDays = bills
    .filter((bill) => {
      const date = asDate(bill.updatedAt) || asDate(bill.createdAt);

      return clampDateRange(date, queryStart, end);
    })
    .map((bill) => ({
      _id: {
        date: asDate(bill.updatedAt) || asDate(bill.createdAt),
        category: safeString(bill.billType, "miscellaneous"),
      },
      amount: money(bill.totalAmount),
    }));

  const occupancyRows = occupancyRowsFromMap(dailyMap, totalRooms);

  const adrRows = adrRowsFromMap(dailyMap);

  const rateHeatmapRows = buildRoomTypeHeatmap(bookings, queryStart, end);

  const reservationDays = dailyRows;

  const bookingDays = buildBookingDays(bookings, queryStart, end);

  const bookingLeadRows = buildBookingLeadRows(bookings, selectedStart, end);

  const roomTypeRows = buildRoomTypeRows(bookings, selectedStart, end);

  const sourceRows = buildSourceRows(bookings, selectedStart, end);

  const paymentRows = buildPaymentRows(payments, selectedStart, end);

  const weekdayRows = buildWeekdayRows(bookings, selectedStart, end);

  const roomsByTypeMap = new Map();

  for (const room of rooms) {
    const type = safeString(room.type || room.roomCode || "Unknown");

    roomsByTypeMap.set(type, (roomsByTypeMap.get(type) || 0) + 1);
  }

  const roomsByType = [...roomsByTypeMap.entries()].map(([type, total]) => ({
    _id: type,
    total,
  }));

  const guestIds = new Set();

  for (const booking of bookings) {
    if (booking.guestId) {
      guestIds.add(booking.guestId.toString());
    }
  }

  const guestTotal = guestIds.size;

  const nationalityRows = buildNationalityRows(bookings);

  const cityRows = buildCityRows(bookings);

  const purposeRows = buildPurposeRows(bookings, selectedStart, end);

  const occupancyDetailRows = buildOccupancyDetailRows(
    bookings,
    queryStart,
    end,
  );

  const rawOccupancyRows = buildRawOccupancyRows(bookings, queryStart, end);

  const guestAgeRows = buildGuestAgeRows();

  const repeatGuestRows = buildRepeatGuestRows(bookings);

  const guestCohortRows = buildGuestCohortRows(bookings);

  const stayDurationRows = buildStayDurationRows(bookings, selectedStart, end);

  const cancellationSourceRows = buildCancellationSourceRows(
    bookings,
    selectedStart,
    end,
  );

  const cancellationLeadRows = buildCancellationLeadRows(
    bookings,
    selectedStart,
    end,
  );

  const reservationCancellationReasons = buildCancellationReasonRows(
    bookings,
    selectedStart,
    end,
  );

  const cancellationRows = buildCancellationRows(bookings, queryStart, end);

  const cancellationReasons = reservationCancellationReasons;

  /*
   * Compute fresh forecasts from the actual Omni operational history.
   *
   * Do not depend on the old `forecasts` collection because that collection
   * is not the source of truth for this Omni database.
   */
  const forecastHorizon = Math.max(
    1,
    Math.ceil((futureEnd.getTime() - end.getTime()) / 86400000),
  );

  const forecastRows = buildForecastRows(
    dailyRows,
    totalRooms,
    forecastHorizon,
  );

  /*
   * Keep the existing dashboard-shape contract intact.
   */
  return computeDashboardPayload({
    id,
    range,
    hotelId: hotelIdValue,
    days,
    end,
    selectedStart,
    queryStart,

    raw: {
      rollups,
      invoiceDays,
      occupancyRows,
      rateHeatmapRows,
      adrRows,
      reservationDays,
      bookingDays,
      bookingLeadRows,
      roomTypeRows,
      sourceRows,
      paymentRows,
      weekdayRows,
      roomsByType,
      guestTotal,
      nationalityRows,
      cityRows,
      purposeRows,
      occupancyDetailRows,
      rawOccupancyRows,
      guestAgeRows,
      repeatGuestRows,
      guestCohortRows,
      stayDurationRows,
      cancellationSourceRows,
      cancellationLeadRows,
      reservationCancellationReasons,
      cancellationRows,
      cancellationReasons,
      forecastRows,
    },
  });
}

// Backwards-compatible name for existing imports.
export const getLiveDashboardData = queryLiveDashboardData;
