import Booking from "../models/Booking.js";
import { bookingDTO } from "../dto/booking.dto.js";
import Room from "#/modules/rooms/models/Room.js";
import Hotel from "#/modules/hotels/models/Hotel.js";
import User from "#/modules/users/models/User.js";
import UserInvite from "#/modules/invites/models/UserInvite.js";

import {
  generateUsername,
  generateTemporaryPassword,
} from "#/shared/utils/generateCredentials.js";

import { sendGuestCredentialsEmail } from "#/shared/services/email.service.js";

import { deleteObjects } from "#/config/r2.js";

import { GUEST_STATUSES } from "#/shared/constants/guest.js";

import logger from "#/utils/logger.js";

// =====================================================
// HELPERS
// =====================================================

async function generateGuestUsername(hotelCode) {
  let number = 1;
  let username;

  // Loop until an unused username is found
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

// Documents arrive as JSON metadata referencing R2 objects the client has
// already uploaded. Each entry: { key, filename, docType, size, mimeType }.
function resolveDocuments(req) {
  if (!Array.isArray(req.body.documents)) {
    return [];
  }

  return req.body.documents.map((doc) => ({
    docType: doc.docType || null,
    filename: doc.filename,
    path: doc.key,
  }));
}

// Best-effort removal of R2 objects referenced by their keys
async function removeFilesQuietly(keys) {
  await deleteObjects(keys);
}

// Free a room back to cleaning state
async function freeRoom(roomId) {
  await Room.findByIdAndUpdate(roomId, {
    status: "cleaning",
    currentGuest: null,
    checkIn: null,
    checkOut: null,
  });
}

// Occupy/reserve a room with guest display info
async function claimRoom(roomId, { guestName, checkIn, checkOut, reserved }) {
  await Room.findByIdAndUpdate(roomId, {
    status: reserved ? "reserved" : "occupied",
    currentGuest: guestName,
    checkIn: checkIn || null,
    checkOut: checkOut || null,
  });
}

async function sendCredentialsQuietly({
  email,
  name,
  username,
  temporaryPassword,
  hotelName,
}) {
  try {
    await sendGuestCredentialsEmail({
      email,
      name,
      username,
      password: temporaryPassword,
      hotelName,
    });

    return true;
  } catch (error) {
    logger.error(error, "Guest credentials email failed");

    return false;
  }
}

// =====================================================
// REGISTER GUEST STAY (creates login account + booking)
// =====================================================

export const registerStay = async (req, res) => {
  let createdUser = null;
  let createdBooking = null;
  let uploadedPaths = [];

  try {
    const {
      name,
      email,
      phone,
      address,
      idType,
      idNumber,
      roomId,
      checkIn,
      checkOut,
      status,
    } = req.body;

    // =================================================
    // VALIDATION
    // =================================================

    if (!name?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Guest name is required" });
    }

    if (!email?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Guest email is required" });
    }

    if (!roomId) {
      return res
        .status(400)
        .json({ success: false, message: "Room is required" });
    }

    const guestStatus = status === "reserved" ? "reserved" : "checked-in";

    if (guestStatus === "checked-in" && !checkIn) {
      return res
        .status(400)
        .json({ success: false, message: "Check-in date is required" });
    }

    if (!checkOut) {
      return res
        .status(400)
        .json({ success: false, message: "Check-out date is required" });
    }

    if (checkIn && new Date(checkOut) <= new Date(checkIn)) {
      return res
        .status(400)
        .json({ success: false, message: "Check-out must be after check-in" });
    }

    // =================================================
    // ROOM MUST BELONG TO THE HOTEL AND BE FREE
    // =================================================

    const room = await Room.findOne({
      _id: roomId,
      hotelId: req.user.hotelId,
    });

    if (!room) {
      uploadedPaths = resolveDocuments(req).map((d) => d.path);

      await removeFilesQuietly(uploadedPaths);

      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }

    if (["occupied", "reserved"].includes(room.status)) {
      uploadedPaths = resolveDocuments(req).map((d) => d.path);

      await removeFilesQuietly(uploadedPaths);

      return res
        .status(409)
        .json({ success: false, message: "This room is not available" });
    }

    // =================================================
    // GENERATE CREDENTIALS
    // =================================================

    const normalizedEmail = email.trim().toLowerCase();

    const hotel = await Hotel.findById(req.user.hotelId).select(
      "hotelCode name",
    );

    if (!hotel) {
      uploadedPaths = resolveDocuments(req).map((d) => d.path);

      await removeFilesQuietly(uploadedPaths);

      return res.status(400).json({
        success: false,
        message: "You are not assigned to a valid hotel",
      });
    }

    const username = await generateGuestUsername(hotel.hotelCode);

    const temporaryPassword = generateTemporaryPassword();

    const documents = resolveDocuments(req);

    uploadedPaths = documents.map((d) => d.path);

    // =================================================
    // CREATE LOGIN ACCOUNT (role GUEST) + PROFILE
    // =================================================

    createdUser = await User.create({
      name: name.trim(),
      username,
      email: normalizedEmail,
      password: temporaryPassword,
      role: "GUEST",
      hotelId: req.user.hotelId,
      phone: phone?.trim() || "",
      address: address?.trim() || "",
      idType: idType || "Aadhaar",
      idNumber: idNumber?.trim() || "",
      documents,
      isActive: true,
      mustChangePassword: false,
    });

    // =================================================
    // CREATE BOOKING (the stay)
    // =================================================

    createdBooking = await Booking.create({
      guestId: createdUser._id,
      hotelId: req.user.hotelId,
      roomId: room._id,
      checkIn: checkIn ? new Date(checkIn) : undefined,
      checkOut: new Date(checkOut),
      status: guestStatus,
    });

    // =================================================
    // SYNC THE ROOM
    // =================================================

    await claimRoom(room._id, {
      guestName: createdUser.name,
      checkIn: createdBooking.checkIn,
      checkOut: createdBooking.checkOut,
      reserved: guestStatus === "reserved",
    });

    // =================================================
    // EMAIL THE CREDENTIALS (non-blocking failure)
    // =================================================

    const credentialsEmailSent = await sendCredentialsQuietly({
      email: createdUser.email,
      name: createdUser.name,
      username,
      temporaryPassword,
      hotelName: hotel.name,
    });

    logger.info(
      {
        bookingId: createdBooking._id,
        guestId: createdUser._id,
        username,
        credentialsEmailSent,
      },
      "Guest registered",
    );

    const populated = await Booking.findById(createdBooking._id)
      .populate("guestId")
      .populate("roomId", "roomNumber type rate floor");

    return res.status(201).json({
      success: true,
      message: "Guest registered successfully",
      data: {
        ...(await bookingDTO(populated)),
        credentials: {
          username,
          temporaryPassword,
          emailSent: credentialsEmailSent,
        },
      },
    });
  } catch (error) {
    logger.error(error, "Register Guest Error");

    // Roll back partial data
    if (createdBooking) {
      try {
        await Booking.deleteOne({ _id: createdBooking._id });
      } catch {
        // Best effort rollback
      }
    }

    if (createdUser) {
      try {
        await User.deleteOne({ _id: createdUser._id });
        await UserInvite.deleteMany({ userId: createdUser._id });
      } catch {
        // Best effort rollback
      }
    }

    await removeFilesQuietly(uploadedPaths);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A user with these details already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to register guest",
    });
  }
};

// =====================================================
// LIST BOOKINGS (guest stays)
// =====================================================

export const getBookings = async (req, res) => {
  try {
    const filter = { hotelId: req.user.hotelId };

    if (
      req.query.status &&
      ["reserved", "checked-in", "checked-out"].includes(req.query.status)
    ) {
      filter.status = req.query.status;
    }

    const bookings = await Booking.find(filter)
      .populate("guestId")
      .populate("roomId", "roomNumber type rate floor")
      .sort({ createdAt: -1 });

    const data = await Promise.all(bookings.map((b) => bookingDTO(b)));

    return res.status(200).json({
      success: true,
      message: "Bookings fetched successfully",
      data,
    });
  } catch (error) {
    logger.error(error, "Get Bookings Error");

    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
    });
  }
};

// =====================================================
// GET SINGLE BOOKING
// =====================================================

export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    })
      .populate("guestId")
      .populate("roomId", "roomNumber type rate floor");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking fetched successfully",
      data: await bookingDTO(booking),
    });
  } catch (error) {
    logger.error(error, "Get Booking Error");

    return res.status(500).json({
      success: false,
      message: "Failed to fetch booking",
    });
  }
};

// =====================================================
// UPDATE BOOKING (stay fields)
// =====================================================

export const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const { status, checkIn, checkOut, roomId } = req.body;

    const guestUser = await User.findById(booking.guestId).select("name");

    // Room reassignment
    if (roomId && String(roomId) !== String(booking.roomId)) {
      const room = await Room.findOne({
        _id: roomId,
        hotelId: req.user.hotelId,
      });

      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }

      if (["occupied", "reserved"].includes(room.status)) {
        return res.status(409).json({
          success: false,
          message: "This room is not available",
        });
      }

      await claimRoom(room._id, {
        guestName: guestUser?.name,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        reserved: booking.status === "reserved",
      });

      await freeRoom(booking.roomId);

      booking.roomId = room._id;
    }

    if (checkIn) {
      booking.checkIn = new Date(checkIn);
    }

    if (checkOut) {
      if (booking.checkIn && new Date(checkOut) <= new Date(booking.checkIn)) {
        return res.status(400).json({
          success: false,
          message: "Check-out must be after check-in",
        });
      }

      booking.checkOut = new Date(checkOut);
    }

    if (status) {
      if (!GUEST_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking status",
        });
      }

      const wasCheckedOut = booking.status === "checked-out";

      booking.status = status;

      if (status === "checked-out" && !wasCheckedOut) {
        await freeRoom(booking.roomId);
      }

      if (wasCheckedOut && status !== "checked-out") {
        await claimRoom(booking.roomId, {
          guestName: guestUser?.name,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          reserved: status === "reserved",
        });
      }
    }

    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate("guestId")
      .populate("roomId", "roomNumber type rate floor");

    return res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: await bookingDTO(populated),
    });
  } catch (error) {
    logger.error(error, "Update Booking Error");

    return res.status(500).json({
      success: false,
      message: "Failed to update booking",
    });
  }
};

// =====================================================
// DELETE BOOKING
// =====================================================

export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const roomId = booking.roomId;
    const wasActive = booking.status !== "checked-out";

    const guest = await User.findById(booking.guestId);

    // Each stay owns a unique login account (per stay/booking) — remove it
    // along with invites and stored document files.
    if (guest) {
      await User.deleteOne({ _id: guest._id });
      await UserInvite.deleteMany({ userId: guest._id });

      await removeFilesQuietly(guest.documents.map((d) => d.path));
    }

    await booking.deleteOne();

    // Free the room only if no other active booking holds it
    if (wasActive) {
      const stillHeld = await Booking.exists({
        roomId,
        hotelId: req.user.hotelId,
        status: { $ne: "checked-out" },
        _id: { $ne: booking._id },
      });

      if (!stillHeld) {
        await freeRoom(roomId);
      }
    }

    logger.info({ bookingId: booking._id }, "Booking deleted");

    return res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error) {
    logger.error(error, "Delete Booking Error");

    return res.status(500).json({
      success: false,
      message: "Failed to delete booking",
    });
  }
};
