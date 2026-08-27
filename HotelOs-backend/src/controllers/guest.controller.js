import path from "path";
import fs from "fs";

import Guest from "../models/Guest.js";
import { guestResponseDTO } from "../models/Guest.js";
import Room from "../models/Room.js";
import Hotel from "../models/Hotel.js";
import User from "../models/User.js";
import UserInvite from "../models/UserInvite.js";

import {
  generateUsername,
  generateTemporaryPassword
} from "../utils/generateCredentials.js";

import { sendGuestCredentialsEmail } from "../services/email.service.js";

import crypto from "crypto";

// =====================================================
// HELPERS
// =====================================================

async function generateGuestUsername(hotelCode) {
  let number = 1;
  let username;

  // Loop until an unused username is found
  do {
    username = generateUsername(hotelCode, "GST", String(number).padStart(3, "0"));

    const existingUser = await User.findOne({ username });

    if (!existingUser) {
      break;
    }

    number++;
  } while (number <= 9999);

  return username;
}

function resolveDocumentFiles(req) {
  // Files arrive as req.files (multer .array("documents")).
  // Optional docTypes JSON array runs parallel to the file order.
  let docTypes = [];

  try {
    if (req.body.docTypes) {
      docTypes = JSON.parse(req.body.docTypes);
    }
  } catch {
    docTypes = [];
  }

  return (req.files || []).map((file, index) => ({
    docType: docTypes[index] || null,
    filename: file.originalname,
    path: file.path
  }));
}

async function removeFilesQuietly(files) {
  for (const filePath of files || []) {
    try {
      await fs.promises.unlink(filePath);
    } catch {
      // File may already be gone - nothing to do
    }
  }
}

// Free a room back to cleaning state
async function freeRoom(roomId) {
  await Room.findByIdAndUpdate(roomId, {
    status: "cleaning",
    currentGuest: null,
    checkIn: null,
    checkOut: null
  });
}

// Occupy/reserve a room with guest display info
async function claimRoom(roomId, { guestName, checkIn, checkOut, reserved }) {
  await Room.findByIdAndUpdate(roomId, {
    status: reserved ? "reserved" : "occupied",
    currentGuest: guestName,
    checkIn: checkIn || null,
    checkOut: checkOut || null
  });
}

async function sendCredentialsQuietly({ email, name, username, temporaryPassword, hotelName }) {
  try {
    await sendGuestCredentialsEmail({
      email,
      name,
      username,
      password: temporaryPassword,
      hotelName
    });

    return true;
  } catch (error) {
    console.error("GUEST CREDENTIALS EMAIL FAILED:", error.message);

    return false;
  }
}

// =====================================================
// REGISTER GUEST (multipart)
// =====================================================

export const registerGuest = async (req, res) => {
  let createdUser = null;
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
      status
    } = req.body;

    // =================================================
    // VALIDATION
    // =================================================

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Guest name is required" });
    }

    if (!email?.trim()) {
      return res.status(400).json({ success: false, message: "Guest email is required" });
    }

    if (!roomId) {
      return res.status(400).json({ success: false, message: "Room is required" });
    }

    const guestStatus =
      status === "reserved" ? "reserved" : "checked-in";

    if (guestStatus === "checked-in" && !checkIn) {
      return res.status(400).json({ success: false, message: "Check-in date is required" });
    }

    if (!checkOut) {
      return res.status(400).json({ success: false, message: "Check-out date is required" });
    }

    if (checkIn && new Date(checkOut) <= new Date(checkIn)) {
      return res.status(400).json({ success: false, message: "Check-out must be after check-in" });
    }

    // =================================================
    // ROOM MUST BELONG TO THE HOTEL AND BE FREE
    // =================================================

    const room = await Room.findOne({
      _id: roomId,
      hotelId: req.user.hotelId
    });

    if (!room) {
      uploadedPaths = (req.files || []).map((f) => f.path);

      await removeFilesQuietly(uploadedPaths);

      return res.status(404).json({ success: false, message: "Room not found" });
    }

    if (["occupied", "reserved"].includes(room.status)) {
      uploadedPaths = (req.files || []).map((f) => f.path);

      await removeFilesQuietly(uploadedPaths);

      return res.status(409).json({ success: false, message: "This room is not available" });
    }

    // =================================================
    // EMAIL MUST NOT ALREADY HAVE AN ACCOUNT
    // =================================================

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      uploadedPaths = (req.files || []).map((f) => f.path);

      await removeFilesQuietly(uploadedPaths);

      return res.status(409).json({ success: false, message: "A user with this email already exists" });
    }

    // =================================================
    // GENERATE CREDENTIALS
    // =================================================

    const hotel = await Hotel.findById(req.user.hotelId).select("hotelCode name");

    if (!hotel) {
      uploadedPaths = (req.files || []).map((f) => f.path);

      await removeFilesQuietly(uploadedPaths);

      return res.status(400).json({ success: false, message: "You are not assigned to a valid hotel" });
    }

    const username = await generateGuestUsername(hotel.hotelCode);

    const temporaryPassword = generateTemporaryPassword();

    // =================================================
    // CREATE LOGIN ACCOUNT (role GUEST)
    // =================================================

    createdUser = await User.create({
      name: name.trim(),
      username,
      email: normalizedEmail,
      password: temporaryPassword,
      role: "GUEST",
      hotelId: req.user.hotelId,
      roomId: room._id,
      isActive: true,
      mustChangePassword: false
    });

    // =================================================
    // CREATE GUEST PROFILE WITH DOCUMENTS
    // =================================================

    const documents = resolveDocumentFiles(req);

    uploadedPaths = documents.map((d) => d.path);

    const guest = await Guest.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || "",
      address: address?.trim() || "",
      idType: idType || "Aadhaar",
      idNumber: idNumber?.trim() || "",
      roomId: room._id,
      hotelId: req.user.hotelId,
      userId: createdUser._id,
      checkIn: checkIn ? new Date(checkIn) : undefined,
      checkOut: new Date(checkOut),
      status: guestStatus,
      documents
    });

    // =================================================
    // SYNC THE ROOM
    // =================================================

    await claimRoom(room._id, {
      guestName: guest.name,
      checkIn: guest.checkIn,
      checkOut: guest.checkOut,
      reserved: guestStatus === "reserved"
    });

    // =================================================
    // EMAIL THE CREDENTIALS (non-blocking failure)
    // =================================================

    const credentialsEmailSent = await sendCredentialsQuietly({
      email: guest.email,
      name: guest.name,
      username,
      temporaryPassword,
      hotelName: hotel.name
    });

    console.log(
      "GUEST REGISTERED:",
      guest._id,
      "| USERNAME:",
      username,
      "| EMAIL SENT:",
      credentialsEmailSent
    );

    return res.status(201).json({
      success: true,
      message: "Guest registered successfully",
      data: {
        ...guestResponseDTO(guest.toJSON()),
        credentials: {
          username,
          temporaryPassword,
          emailSent: credentialsEmailSent
        }
      }
    });
  } catch (error) {
    console.error("Register Guest Error:", error);

    // Roll back partial data
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
        message: "A user with these details already exists"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to register guest"
    });
  }
};

// =====================================================
// LIST GUESTS
// =====================================================

export const getGuests = async (req, res) => {
  try {
    const filter = { hotelId: req.user.hotelId };

    if (req.query.status && ["reserved", "checked-in", "checked-out"].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const guests = await Guest.find(filter)
      .populate("roomId", "roomNumber type rate floor")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Guests fetched successfully",
      data: guests.map((g) =>
        guestResponseDTO(g, {
          room: g.roomId
            ? {
                id: g.roomId._id,
                roomNumber: g.roomId.roomNumber,
                type: g.roomId.type,
                rate: g.roomId.rate,
                floor: g.roomId.floor
              }
            : null
        })
      )
    });
  } catch (error) {
    console.error("Get Guests Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch guests"
    });
  }
};

// =====================================================
// GET SINGLE GUEST
// =====================================================

export const getGuestById = async (req, res) => {
  try {
    const guest = await Guest.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId
    }).populate("roomId", "roomNumber type rate floor");

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Guest fetched successfully",
      data: guestResponseDTO(guest, {
        room: guest.roomId
          ? {
              id: guest.roomId._id,
              roomNumber: guest.roomId.roomNumber,
              type: guest.roomId.type,
              rate: guest.roomId.rate,
              floor: guest.roomId.floor
            }
          : null
      })
    });
  } catch (error) {
    console.error("Get Guest Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch guest"
    });
  }
};

// =====================================================
// UPDATE GUEST
// =====================================================

export const updateGuest = async (req, res) => {
  let uploadedPaths = [];

  try {
    const guest = await Guest.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId
    });

    if (!guest) {
      uploadedPaths = (req.files || []).map((f) => f.path);

      await removeFilesQuietly(uploadedPaths);

      return res.status(404).json({
        success: false,
        message: "Guest not found"
      });
    }

    const allowedFields = ["name", "phone", "address", "idType", "idNumber"];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        guest[field] = req.body[field];
      }
    }

    // Email change must stay unique across users
    if (req.body.email !== undefined && req.body.email.trim().toLowerCase() !== guest.email) {
      const clash = await User.findOne({
        email: req.body.email.trim().toLowerCase()
      });

      if (clash && String(clash._id) !== String(guest.userId)) {
        uploadedPaths = (req.files || []).map((f) => f.path);

        await removeFilesQuietly(uploadedPaths);

        return res.status(409).json({
          success: false,
          message: "Another account already uses this email"
        });
      }

      guest.email = req.body.email.trim().toLowerCase();
    }

    // Optional new documents (multipart edit)
    const newDocuments = resolveDocumentFiles(req);

    uploadedPaths = newDocuments.map((d) => d.path);

    if (newDocuments.length > 0) {
      guest.documents.push(...newDocuments);
    }

    await guest.save();

    // Keep the login account name in sync
    if (req.body.name?.trim()) {
      await User.updateOne(
        { _id: guest.userId },
        { name: req.body.name.trim() }
      );
    }

    // Status transition to checked-out frees the room
    if (
      req.body.status === "checked-out" &&
      guest.status !== "checked-out"
    ) {
      guest.status = "checked-out";

      await guest.save();

      await freeRoom(guest.roomId);
    }

    const populated = await Guest.findById(guest._id).populate(
      "roomId",
      "roomNumber type rate floor"
    );

    return res.status(200).json({
      success: true,
      message: "Guest updated successfully",
      data: guestResponseDTO(populated, {
        room: populated.roomId
          ? {
              id: populated.roomId._id,
              roomNumber: populated.roomId.roomNumber,
              type: populated.roomId.type,
              rate: populated.roomId.rate,
              floor: populated.roomId.floor
            }
          : null
      })
    });
  } catch (error) {
    console.error("Update Guest Error:", error);

    await removeFilesQuietly(uploadedPaths);

    return res.status(500).json({
      success: false,
      message: "Failed to update guest"
    });
  }
};

// =====================================================
// UPDATE GUEST CREDENTIALS
// =====================================================

export const updateGuestCredentials = async (req, res) => {
  try {
    const guest = await Guest.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId
    });

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest not found"
      });
    }

    const user = await User.findById(guest.userId).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Guest login account not found"
      });
    }

    const regenerate = req.body.action === "regenerate";

    const newPassword =
      regenerate
        ? generateTemporaryPassword()
        : req.body.password;

    if (!regenerate && (!newPassword || newPassword.length < 8)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long"
      });
    }

    user.password = newPassword;

    await user.save();

    const hotel = await Hotel.findById(req.user.hotelId).select("name");

    let emailSent = false;

    if (regenerate) {
      emailSent = await sendCredentialsQuietly({
        email: guest.email,
        name: guest.name,
        username: user.username,
        temporaryPassword: newPassword,
        hotelName: hotel?.name || ""
      });
    }

    console.log("GUEST CREDENTIALS UPDATED:", guest._id);

    return res.status(200).json({
      success: true,
      message: regenerate
        ? "New credentials generated and emailed to the guest"
        : "Password updated successfully",
      data: {
        username: user.username,
        ...(regenerate || req.body.reveal === true
          ? { temporaryPassword: newPassword, emailSent }
          : {})
      }
    });
  } catch (error) {
    console.error("Update Guest Credentials Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update guest credentials"
    });
  }
};

// =====================================================
// DELETE GUEST DOCUMENT
// =====================================================

export const deleteGuestDocument = async (req, res) => {
  try {
    const guest = await Guest.findOne({
      _id: req.params.guestId,
      hotelId: req.user.hotelId
    });

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest not found"
      });
    }

    const document = guest.documents.id(req.params.docId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    guest.documents.pull(document._id);

    await guest.save();

    await removeFilesQuietly([document.path]);

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully",
      data: { id: guest._id, documents: guest.documents }
    });
  } catch (error) {
    console.error("Delete Guest Document Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete document"
    });
  }
};

// =====================================================
// DELETE GUEST
// =====================================================

export const deleteGuest = async (req, res) => {
  try {
    const guest = await Guest.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId
    });

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest not found"
      });
    }

    const roomId = guest.roomId;
    const wasActive = guest.status !== "checked-out";

    // Remove login account and invites
    await User.deleteOne({ _id: guest.userId });
    await UserInvite.deleteMany({ userId: guest.userId });

    // Remove stored document files
    await removeFilesQuietly(guest.documents.map((d) => d.path));

    await guest.deleteOne();

    // Free the room only if no other active guest holds it
    if (wasActive) {
      const stillHeld = await Guest.exists({
        roomId,
        hotelId: req.user.hotelId,
        status: { $ne: "checked-out" },
        _id: { $ne: guest._id }
      });

      if (!stillHeld) {
        await freeRoom(roomId);
      }
    }

    console.log("GUEST DELETED:", guest._id);

    return res.status(200).json({
      success: true,
      message: "Guest deleted successfully"
    });
  } catch (error) {
    console.error("Delete Guest Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete guest"
    });
  }
};
