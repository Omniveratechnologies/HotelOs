import Room from "#/modules/rooms/models/Room.js";
import Hotel from "#/modules/hotels/models/Hotel.js";
import User from "#/modules/users/models/User.js";
import Booking from "#/modules/bookings/models/Booking.js";

import {
  generateUsername,
  generateTemporaryPassword,
} from "#/shared/utils/generateCredentials.js";
import { aiosellSyncInventory } from "#/shared/services/inventory.service.js";
import { emitToHotel } from "#/shared/services/socket.service.js";
import {
  OTA_CHANNELS,
  ACTIVE_STAY_STATUSES,
} from "#/modules/bookings/constants.js";
import { nextReservationNo } from "#/modules/bookings/services/reservationNo.service.js";

import logger from "#/utils/logger.js";

// Inbound OTA webhooks from Aiosell (book / modify / cancel). OTA bookings do
// NOT require guest data (OTAs may not share it), so guestId stays null in that
// case. modify/cancel match bookings via aiosellBookingId.

// Helpers

async function generateGuestUsername(hotelCode) {
  let number = 1;
  let username;

  do {
    username = generateUsername(
      hotelCode,
      "GST",
      String(number).padStart(3, "0"),
    );

    // oxlint-disable-next-line no-await-in-loop -- sequential uniqueness check; each iteration depends on the previous query result
    const existingUser = await User.findOne({ username });

    if (!existingUser) {
      break;
    }

    number++;
  } while (number <= 9999);

  return username;
}

async function findAvailableRoom(
  hotelId,
  roomCode,
  checkIn,
  checkOut,
  excludedBookingId = null,
) {
  const rooms = await Room.find({ hotelId, roomCode }).sort({ roomNumber: 1 });
  if (rooms.length === 0) return null;

  const conflicts = await Booking.find({
    hotelId,
    roomId: { $in: rooms.map((room) => room._id) },
    status: { $in: ACTIVE_STAY_STATUSES },
    // A checkout date is available for the next guest's check-in, so these
    // bounds must be exclusive rather than inclusive.
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
    ...(excludedBookingId ? { _id: { $ne: excludedBookingId } } : {}),
  }).distinct("roomId");

  const occupiedRoomIds = new Set(conflicts.map(String));
  return rooms.find((room) => !occupiedRoomIds.has(String(room._id))) || null;
}

function parseReservationDates(checkin, checkout) {
  const checkIn = new Date(checkin);
  const checkOut = new Date(checkout);

  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    return null;
  }

  // Day-granular stay dates (see booking.controller parseDate).
  checkIn.setHours(0, 0, 0, 0);
  checkOut.setHours(0, 0, 0, 0);

  if (checkOut <= checkIn) {
    return null;
  }

  return { checkIn, checkOut };
}

// Normalizes an inbound OTA channel label to the otaInfo.channel enum.
function mapOtaChannel(channel) {
  const normalized = String(channel || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  const known = {
    BOOKING_COM: ["BOOKING_COM", "BOOKING", "BOOKINGCOM"],
    AIRBNB: ["AIRBNB"],
    AGODA: ["AGODA"],
    EXPEDIA: ["EXPEDIA"],
    GOIBIBO: ["GOIBIBO"],
    MAKEMYTRIP: ["MAKEMYTRIP", "MMT"],
  };

  for (const [key, aliases] of Object.entries(known)) {
    if (aliases.includes(normalized)) return key;
  }

  return OTA_CHANNELS.includes(normalized) ? normalized : "OTHER";
}

async function claimRoom(roomId, { guestName, checkIn, checkOut, reserved }) {
  await Room.findByIdAndUpdate(roomId, {
    status: reserved ? "reserved" : "occupied",
    currentGuest: guestName,
    checkIn: checkIn || null,
    checkOut: checkOut || null,
  });
}

async function freeRoom(roomId) {
  await Room.findByIdAndUpdate(roomId, {
    status: "cleaning",
    currentGuest: null,
    checkIn: null,
    checkOut: null,
  });
}

// Create a guest user when the OTA shared guest data; otherwise return null.
async function createOtaGuest(hotel, guest, bookingId) {
  if (!guest?.firstName && !guest?.email) return null;

  const name =
    [guest.firstName, guest.lastName].filter(Boolean).join(" ") || "OTA Guest";
  const email = (guest.email || `${bookingId}@ota.placeholder`).toLowerCase();
  const address = [
    guest.address?.line1,
    guest.address?.city,
    guest.address?.state,
    guest.address?.country,
  ]
    .filter(Boolean)
    .join(", ");

  return User.create({
    name,
    username: await generateGuestUsername(hotel.hotelCode),
    email,
    password: generateTemporaryPassword(),
    role: "GUEST",
    hotelId: hotel._id,
    phone: guest.phone || "",
    address,
    isActive: true,
    mustChangePassword: false,
  });
}

function emitQuietly(hotelId, event, payload) {
  try {
    emitToHotel(hotelId, event, payload);
  } catch (error) {
    logger.error(error, `Socket emit failed for ${event}`);
  }
}

// =====================================================
// HANDLE OTA BOOKING
// =====================================================

async function handleBooking(payload) {
  const {
    hotelCode,
    bookingId,
    channel,
    checkin,
    checkout,
    guest,
    rooms,
    amount,
    specialRequests,
    bookedOn,
  } = payload;

  const hotel = await Hotel.findOne({ aiosellHotelCode: hotelCode });
  if (!hotel) {
    logger.error({ hotelCode }, "Hotel not found for Aiosell booking");
    return { success: false, message: "Hotel not found" };
  }

  // Aiosell may retry a delivery after a network timeout. Treat a repeated
  // booking ID for the same hotel as a successful no-op so retries cannot
  // create duplicate reservations or consume inventory twice.
  const existingDelivery = await Booking.findOne({
    hotelId: hotel._id,
    aiosellBookingId: bookingId,
  });
  if (existingDelivery) {
    return { success: true, message: "Reservation Updated Successfully" };
  }

  if (!Array.isArray(rooms) || rooms.length !== 1) {
    return {
      success: false,
      message:
        "Exactly one room is required; multi-room OTA bookings are not supported yet",
    };
  }

  const reservationDates = parseReservationDates(checkin, checkout);
  if (!reservationDates) {
    return {
      success: false,
      message: "A valid check-in/check-out date range is required",
    };
  }

  const roomData = rooms[0];

  const room = await findAvailableRoom(
    hotel._id,
    roomData.roomCode,
    reservationDates.checkIn,
    reservationDates.checkOut,
  );
  if (!room) {
    logger.error(
      { hotelCode, roomCode: roomData.roomCode },
      "Room not found for Aiosell booking",
    );
    return { success: false, message: "Room type not found" };
  }

  const guestUser = await createOtaGuest(hotel, guest, bookingId);

  const grossAmount = (amount?.amountBeforeTax || 0) + (amount?.tax || 0);
  const commissionAmount = amount?.commission || 0;

  const booking = await Booking.create({
    reservationNo: await nextReservationNo(hotel._id),
    source: "OTA",
    guestId: guestUser?._id,
    hotelId: hotel._id,
    roomId: room._id,
    roomTypeCode: roomData.roomCode || null,
    checkIn: reservationDates.checkIn,
    checkOut: reservationDates.checkOut,
    status: "confirmed",
    channel: channel || "OTA",
    aiosellBookingId: bookingId,
    bookedOn: bookedOn ? new Date(bookedOn) : new Date(),
    totalAmountBeforeTax: amount?.amountBeforeTax || 0,
    tax: amount?.tax || 0,
    commission: commissionAmount,
    currency: amount?.currency || "INR",
    specialRequests: specialRequests || null,
    paymentStatus: "unpaid",
    otaInfo: {
      channel: mapOtaChannel(channel),
      otaBookingId: bookingId,
      confirmationCode: payload.confirmationCode || bookingId,
      otaRoomName: roomData.roomName || null,
      commissionPercent: amount?.commissionPercent || null,
      commissionAmount,
      netAmount: grossAmount - commissionAmount,
      paymentStatus: "prepaid-by-ota",
      cancellationPolicy: payload.cancellationPolicy
        ? {
            freeUntil: payload.cancellationPolicy.freeUntil
              ? new Date(payload.cancellationPolicy.freeUntil)
              : null,
            penalty: payload.cancellationPolicy.penalty || null,
          }
        : undefined,
    },
    pricing: {
      nightlyRate: Math.round(
        (amount?.amountBeforeTax || 0) /
          Math.max(
            1,
            Math.round(
              (reservationDates.checkOut - reservationDates.checkIn) / 86400000,
            ),
          ),
      ),
      rateSource: "override",
      roomCharge: amount?.amountBeforeTax || 0,
      addOns: [],
      addOnsTotal: 0,
      discount: { type: null, value: 0, amount: 0 },
      taxableBase: amount?.amountBeforeTax || 0,
      taxPercent: amount?.amountBeforeTax
        ? Math.round(((amount?.tax || 0) / amount.amountBeforeTax) * 100)
        : 0,
      taxAmount: amount?.tax || 0,
      grandTotal: grossAmount,
      currency: amount?.currency || "INR",
    },
    auditTrail: [
      { by: null, action: "created", to: "confirmed", note: "OTA import" },
    ],
  });

  await claimRoom(room._id, {
    guestName: guestUser?.name || "OTA Guest",
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    reserved: true,
  });

  // Best-effort side effect — must never block/break the webhook response.
  try {
    await aiosellSyncInventory(hotel._id);
  } catch (syncError) {
    logger.error(syncError, "Inventory re-sync after OTA booking failed");
  }

  emitQuietly(hotel._id, "booking:created", {
    id: booking._id,
    channel: booking.channel,
    roomNumber: room.roomNumber,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guestName: guestUser?.name || "OTA Guest",
  });

  logger.info(
    { bookingId: booking._id, aiosellBookingId: bookingId, channel },
    "OTA booking created",
  );
  return { success: true, message: "Reservation Updated Successfully" };
}

// =====================================================
// HANDLE OTA MODIFICATION
// =====================================================

async function handleModification(payload) {
  const { hotelCode, bookingId, checkin, checkout, rooms, amount } = payload;

  const hotel = await Hotel.findOne({ aiosellHotelCode: hotelCode });
  if (!hotel) return { success: false, message: "Hotel not found" };

  const booking = await Booking.findOne({
    hotelId: hotel._id,
    aiosellBookingId: bookingId,
  });

  if (!booking) {
    logger.warn({ bookingId }, "Modification for unknown booking");
    return { success: false, message: "Booking not found" };
  }

  if (!Array.isArray(rooms) || rooms.length !== 1) {
    return {
      success: false,
      message:
        "Exactly one room is required; multi-room OTA bookings are not supported yet",
    };
  }

  const reservationDates = parseReservationDates(checkin, checkout);
  if (!reservationDates) {
    return {
      success: false,
      message: "A valid check-in/check-out date range is required",
    };
  }

  const room = await findAvailableRoom(
    hotel._id,
    rooms[0].roomCode,
    reservationDates.checkIn,
    reservationDates.checkOut,
    booking._id,
  );
  if (!room) {
    return { success: false, message: "Room not available for these dates" };
  }

  const previousRoomId = booking.roomId;
  booking.checkIn = reservationDates.checkIn;
  booking.checkOut = reservationDates.checkOut;
  booking.roomId = room._id;

  if (amount) {
    booking.totalAmountBeforeTax =
      amount.amountBeforeTax ?? booking.totalAmountBeforeTax;
    booking.tax = amount.tax ?? booking.tax;
    booking.commission = amount.commission ?? booking.commission;

    const gross = booking.totalAmountBeforeTax + booking.tax;
    if (booking.otaInfo) {
      booking.otaInfo.commissionAmount = booking.commission;
      booking.otaInfo.netAmount = gross - booking.commission;
      if (amount.commissionPercent != null) {
        booking.otaInfo.commissionPercent = amount.commissionPercent;
      }
    }
    if (booking.pricing) {
      booking.pricing.taxableBase = booking.totalAmountBeforeTax;
      booking.pricing.taxAmount = booking.tax;
      booking.pricing.roomCharge = booking.totalAmountBeforeTax;
      booking.pricing.grandTotal = gross;
    }
  }

  booking.roomTypeCode = rooms[0].roomCode || booking.roomTypeCode;
  booking.auditTrail.push({
    by: null,
    action: "ota-modified",
    note: "OTA modification webhook",
  });

  await booking.save();

  const guestUser = booking.guestId
    ? await User.findById(booking.guestId)
    : null;

  await claimRoom(booking.roomId, {
    guestName: guestUser?.name || "OTA Guest",
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    reserved: booking.status !== "checked-in",
  });

  if (previousRoomId && String(previousRoomId) !== String(booking.roomId)) {
    const stillHeld = await Booking.exists({
      roomId: previousRoomId,
      hotelId: hotel._id,
      status: { $in: ACTIVE_STAY_STATUSES },
      _id: { $ne: booking._id },
    });
    if (!stillHeld) await freeRoom(previousRoomId);
  }

  try {
    await aiosellSyncInventory(hotel._id);
  } catch (syncError) {
    logger.error(syncError, "Inventory re-sync after OTA modification failed");
  }

  emitQuietly(hotel._id, "booking:updated", {
    id: booking._id,
    channel: booking.channel,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
  });

  logger.info(
    { bookingId: booking._id, aiosellBookingId: bookingId },
    "OTA booking modified",
  );
  return { success: true, message: "Reservation Updated Successfully" };
}

// =====================================================
// HANDLE OTA CANCELLATION
// =====================================================

async function handleCancellation(payload) {
  const { hotelCode, bookingId } = payload;

  const hotel = await Hotel.findOne({ aiosellHotelCode: hotelCode });
  if (!hotel) return { success: false, message: "Hotel not found" };

  const booking = await Booking.findOne({
    hotelId: hotel._id,
    aiosellBookingId: bookingId,
  });

  if (!booking) {
    logger.warn({ bookingId }, "Cancellation for unknown booking");
    return { success: false, message: "Booking not found" };
  }

  const previousStatus = booking.status;
  booking.status = "cancelled";
  booking.auditTrail.push({
    by: null,
    action: "status-changed",
    from: previousStatus,
    to: "cancelled",
    note: "OTA cancellation webhook",
  });
  await booking.save();

  if (booking.roomId) {
    const stillHeld = await Booking.exists({
      roomId: booking.roomId,
      hotelId: hotel._id,
      status: { $in: ACTIVE_STAY_STATUSES },
      _id: { $ne: booking._id },
    });

    if (!stillHeld) {
      await freeRoom(booking.roomId);
    }
  }

  try {
    await aiosellSyncInventory(hotel._id);
  } catch (syncError) {
    logger.error(syncError, "Inventory re-sync after OTA cancellation failed");
  }

  emitQuietly(hotel._id, "booking:cancelled", {
    id: booking._id,
    channel: booking.channel,
    aiosellBookingId: bookingId,
  });

  logger.info(
    { bookingId: booking._id, aiosellBookingId: bookingId },
    "OTA booking cancelled",
  );
  return { success: true, message: "Reservation Updated Successfully" };
}

// =====================================================
// MAIN WEBHOOK HANDLER
// =====================================================

export const handleWebhook = async (req, res) => {
  try {
    const { action, hotelCode, bookingId } = req.body;

    if (!action || !["book", "modify", "cancel"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: `Invalid action: ${action}`,
      });
    }

    if (!hotelCode || !bookingId) {
      return res.status(400).json({
        success: false,
        message: "hotelCode and bookingId are required",
      });
    }

    let result;

    switch (action) {
      case "book":
        result = await handleBooking(req.body);
        break;
      case "modify":
        result = await handleModification(req.body);
        break;
      case "cancel":
        result = await handleCancellation(req.body);
        break;
    }

    const statusCode = result?.success ? 200 : 400;
    return res
      .status(statusCode)
      .json(result || { success: false, message: "Unhandled action" });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.aiosellBookingId) {
      // A concurrent retry may win the idempotency race after the initial
      // existence check. The unique index makes that outcome a success.
      return res.status(200).json({
        success: true,
        message: "Reservation Updated Successfully",
      });
    }
    logger.error(error, "Channel manager webhook error");
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
