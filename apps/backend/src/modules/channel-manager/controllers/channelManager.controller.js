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

async function findRoomByCode(hotelId, roomCode) {
  return Room.findOne({ hotelId, roomCode });
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

  // Process first room only (multi-room bookings can be extended later).
  const roomData = rooms?.[0];
  if (!roomData) {
    return { success: false, message: "No room data in booking" };
  }

  const room = await findRoomByCode(hotel._id, roomData.roomCode);
  if (!room) {
    logger.error(
      { hotelCode, roomCode: roomData.roomCode },
      "Room not found for Aiosell booking",
    );
    return { success: false, message: "Room type not found" };
  }

  // For OTA bookings check date overlap specifically.
  const existingBooking = await Booking.findOne({
    roomId: room._id,
    hotelId: hotel._id,
    status: { $in: ["reserved", "checked-in"] },
    checkIn: { $lte: new Date(checkout) },
    checkOut: { $gte: new Date(checkin) },
  });
  if (existingBooking) {
    return { success: false, message: "Room not available for these dates" };
  }

  const guestUser = await createOtaGuest(hotel, guest, bookingId);

  const booking = await Booking.create({
    guestId: guestUser?._id,
    hotelId: hotel._id,
    roomId: room._id,
    checkIn: new Date(checkin),
    checkOut: new Date(checkout),
    status: "reserved",
    channel: channel || "OTA",
    aiosellBookingId: bookingId,
    bookedOn: bookedOn ? new Date(bookedOn) : new Date(),
    totalAmountBeforeTax: amount?.amountBeforeTax || 0,
    tax: amount?.tax || 0,
    commission: amount?.commission || 0,
    currency: amount?.currency || "INR",
    specialRequests: specialRequests || null,
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

  if (checkin) booking.checkIn = new Date(checkin);
  if (checkout) booking.checkOut = new Date(checkout);

  if (rooms?.[0]?.roomCode) {
    const room = await findRoomByCode(hotel._id, rooms[0].roomCode);
    if (room && room._id.toString() !== booking.roomId.toString()) {
      booking.roomId = room._id;
    }
  }

  if (amount) {
    booking.totalAmountBeforeTax =
      amount.amountBeforeTax ?? booking.totalAmountBeforeTax;
    booking.tax = amount.tax ?? booking.tax;
    booking.commission = amount.commission ?? booking.commission;
  }

  await booking.save();

  const guestUser = booking.guestId
    ? await User.findById(booking.guestId)
    : null;

  if (booking.roomId) {
    await claimRoom(booking.roomId, {
      guestName: guestUser?.name || "OTA Guest",
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      reserved: booking.status === "reserved",
    });
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

  booking.status = "cancelled";
  await booking.save();

  if (booking.roomId) {
    const stillHeld = await Booking.exists({
      roomId: booking.roomId,
      hotelId: hotel._id,
      status: { $in: ["reserved", "checked-in"] },
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
    const { action } = req.body;

    if (!action || !["book", "modify", "cancel"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: `Invalid action: ${action}`,
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
    logger.error(error, "Channel manager webhook error");
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
