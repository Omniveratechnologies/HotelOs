import "dotenv/config";
import mongoose from "mongoose";
import dns from "node:dns";

// Atlas SRV lookups need public DNS (matches config/db.js).
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import Hotel from "#/modules/hotels/models/Hotel.js";
import Room from "#/modules/rooms/models/Room.js";
import RoomType from "#/modules/room-types/models/RoomType.js";
import RatePlan from "#/modules/rate-plans/models/RatePlan.js";
import User from "#/modules/users/models/User.js";
import Booking from "#/modules/bookings/models/Booking.js";
import { computePricing } from "#/modules/bookings/services/pricing.service.js";
import { nextReservationNo } from "#/modules/bookings/services/reservationNo.service.js";
import {
  generateUsername,
  generateTemporaryPassword,
} from "#/shared/utils/generateCredentials.js";
import logger from "#/utils/logger.js";

// Dev seed: room types, rate plans, rooms and a few reservations using the
// new pricing/availability model for the test hotel (test@hotelos.com).
// Idempotent — safe to re-run. Loops are sequential by design (each upsert
// depends on the previous document state).
/* oxlint-disable no-await-in-loop */

const TEST_HOTEL_EMAIL = "test@hotelos.com";

// Day-granular stay dates (local midnight) to match booking.date semantics.
const at = (daysFromNow) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(0, 0, 0, 0);
  return d;
};

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  logger.info("Connected");

  const hotel = await Hotel.findOne({ email: TEST_HOTEL_EMAIL });
  if (!hotel) {
    throw new Error(
      "Test hotel not found — run `pnpm seed:guest -F backend` first",
    );
  }
  if (hotel.taxPercent == null) {
    hotel.taxPercent = 12;
    await hotel.save();
  }

  // ---- Room types ----
  const typeSeeds = [
    {
      roomCode: "executive",
      name: "Executive",
      count: 2,
      minOccupancy: 1,
      maxOccupancy: 2,
    },
    {
      roomCode: "deluxe",
      name: "Deluxe",
      count: 2,
      minOccupancy: 1,
      maxOccupancy: 3,
    },
  ];
  for (const t of typeSeeds) {
    await RoomType.updateOne(
      { hotelId: hotel._id, roomCode: t.roomCode },
      {
        $setOnInsert: {
          ...t,
          hotelId: hotel._id,
          channelSyncStatus: "completed",
        },
      },
      { upsert: true },
    );
  }

  // ---- Rate plans (Best Available = EP; breakfast = CP) ----
  const planSeeds = [
    {
      roomCode: "executive",
      roomType: "Executive",
      occupancy: "single",
      rate: 2499,
    },
    {
      roomCode: "executive",
      roomType: "Executive",
      occupancy: "double",
      rate: 2899,
    },
    { roomCode: "deluxe", roomType: "Deluxe", occupancy: "single", rate: 3499 },
    { roomCode: "deluxe", roomType: "Deluxe", occupancy: "double", rate: 3899 },
  ];
  for (const p of planSeeds) {
    const ratePlanCode = `${p.roomCode}-${p.occupancy[0]}-ep`;
    await RatePlan.updateOne(
      { hotelId: hotel._id, ratePlanCode },
      {
        $setOnInsert: {
          name: "Best Available Rate",
          ratePlanCode,
          roomCode: p.roomCode,
          roomType: p.roomType,
          rate: p.rate,
          occupancy: p.occupancy,
          mealPlan: "EP",
          hotelId: hotel._id,
          isActive: true,
          channelSyncStatus: "completed",
        },
      },
      { upsert: true },
    );
  }

  // ---- Rooms ----
  const roomSeeds = [
    {
      roomNumber: "101",
      type: "Executive",
      roomCode: "executive",
      rate: 2499,
      floor: 1,
    },
    {
      roomNumber: "102",
      type: "Executive",
      roomCode: "executive",
      rate: 2499,
      floor: 1,
    },
    {
      roomNumber: "201",
      type: "Deluxe",
      roomCode: "deluxe",
      rate: 3499,
      floor: 2,
    },
    {
      roomNumber: "202",
      type: "Deluxe",
      roomCode: "deluxe",
      rate: 3499,
      floor: 2,
    },
  ];
  for (const r of roomSeeds) {
    await Room.updateOne(
      { hotelId: hotel._id, roomNumber: r.roomNumber },
      {
        $setOnInsert: {
          ...r,
          hotelId: hotel._id,
          status: "available",
          channelSyncStatus: "completed",
          channelVerified: true,
        },
      },
      { upsert: true },
    );
  }

  // ---- Guest ----
  const seedUsername = generateUsername(hotel.hotelCode, "GST", "001");
  let guest = await User.findOne({ username: seedUsername });
  if (!guest) {
    guest = await User.create({
      name: "Rohit Sharma",
      username: seedUsername,
      email: "rohit.sharma@example.com",
      password: generateTemporaryPassword(),
      role: "GUEST",
      hotelId: hotel._id,
      phone: "+91 9876543210",
      address: "Kolkata, West Bengal",
      idType: "Aadhaar",
      idNumber: "1234 5678 9012",
      nationality: "Indian",
      isActive: true,
      mustChangePassword: false,
    });
  }

  // ---- Reservations ----
  const executivePlan = await RatePlan.findOne({
    hotelId: hotel._id,
    roomCode: "executive",
    occupancy: "single",
  }).lean();
  const deluxePlan = await RatePlan.findOne({
    hotelId: hotel._id,
    roomCode: "deluxe",
    occupancy: "double",
  }).lean();
  const room101 = await Room.findOne({
    hotelId: hotel._id,
    roomNumber: "101",
  }).lean();

  const makePricing = ({
    rate,
    checkIn,
    checkOut,
    rooms = 1,
    commissionPercent = null,
  }) =>
    computePricing({
      nightlyRate: rate,
      nights: Math.round((checkOut - checkIn) / 86400000),
      rooms,
      taxPercent: hotel.taxPercent ?? 12,
      commissionPercent,
    });

  // 1. Confirmed direct reservation (today, 2 nights, room 101)
  const directCheckIn = at(0);
  const directCheckOut = at(2);
  let direct = await Booking.findOne({
    hotelId: hotel._id,
    roomId: room101?._id,
    guestId: guest._id,
    checkIn: directCheckIn,
  });
  if (!direct) {
    direct = await Booking.create({
      reservationNo: await nextReservationNo(hotel._id),
      source: "DIRECT",
      channel: "DIRECT",
      guestId: guest._id,
      hotelId: hotel._id,
      roomId: room101?._id || null,
      roomTypeCode: "executive",
      ratePlanId: executivePlan?._id || null,
      mealPlan: "EP",
      checkIn: directCheckIn,
      checkOut: directCheckOut,
      status: "confirmed",
      rooms: 1,
      adults: 1,
      children: 0,
      purpose: "Business",
      pricing: makePricing({
        rate: 2499,
        checkIn: directCheckIn,
        checkOut: directCheckOut,
      }),
      paymentStatus: "unpaid",
      auditTrail: [{ action: "created", to: "confirmed", note: "Seed" }],
    });
    await Room.findByIdAndUpdate(room101?._id, {
      status: "reserved",
      currentGuest: guest.name,
      checkIn: directCheckIn,
      checkOut: directCheckOut,
    });
  }

  // 2. Draft reservation (next week, website source, unassigned room)
  const draftCheckIn = at(7);
  const draftCheckOut = at(9);
  let draft = await Booking.findOne({
    hotelId: hotel._id,
    guestId: guest._id,
    status: "draft",
  });
  if (!draft) {
    draft = await Booking.create({
      reservationNo: await nextReservationNo(hotel._id),
      source: "WEBSITE",
      channel: "WEBSITE",
      guestId: guest._id,
      hotelId: hotel._id,
      roomTypeCode: "deluxe",
      ratePlanId: deluxePlan?._id || null,
      mealPlan: "EP",
      checkIn: draftCheckIn,
      checkOut: draftCheckOut,
      status: "draft",
      rooms: 1,
      adults: 2,
      pricing: makePricing({
        rate: 3899,
        checkIn: draftCheckIn,
        checkOut: draftCheckOut,
      }),
      auditTrail: [{ action: "created", to: "draft", note: "Seed" }],
    });
  }

  // 3. OTA reservation (Booking.com, prepaid by OTA)
  let ota = await Booking.findOne({
    hotelId: hotel._id,
    aiosellBookingId: "AIOS-SEED-001",
  });
  if (!ota) {
    const otaCheckIn = at(3);
    const otaCheckOut = at(5);
    const otaPricing = makePricing({
      rate: 2000,
      checkIn: otaCheckIn,
      checkOut: otaCheckOut,
      commissionPercent: 15,
    });
    ota = await Booking.create({
      reservationNo: await nextReservationNo(hotel._id),
      source: "OTA",
      channel: "BOOKING_COM",
      guestId: guest._id,
      hotelId: hotel._id,
      roomTypeCode: "deluxe",
      checkIn: otaCheckIn,
      checkOut: otaCheckOut,
      status: "confirmed",
      aiosellBookingId: "AIOS-SEED-001",
      bookedOn: new Date(),
      rooms: 1,
      adults: 2,
      totalAmountBeforeTax: otaPricing.taxableBase,
      tax: otaPricing.taxAmount,
      commission: otaPricing.commissionAmount,
      pricing: otaPricing,
      paymentStatus: "unpaid",
      otaInfo: {
        channel: "BOOKING_COM",
        otaBookingId: "AIOS-SEED-001",
        confirmationCode: "BCOM-987654",
        commissionPercent: 15,
        commissionAmount: otaPricing.commissionAmount,
        netAmount: otaPricing.netAmount,
        paymentStatus: "prepaid-by-ota",
      },
      auditTrail: [
        { action: "created", to: "confirmed", note: "OTA import (seed)" },
      ],
    });
  }

  logger.info(
    {
      reservationNos: [
        direct.reservationNo,
        draft.reservationNo,
        ota.reservationNo,
      ],
    },
    "Reservations seed complete",
  );
  process.exit(0);
};

seed().catch((err) => {
  logger.error(err);
  process.exit(1);
});
/* oxlint-enable no-await-in-loop */
