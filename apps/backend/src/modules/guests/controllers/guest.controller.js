import crypto from "crypto";

import Guest from "../models/Guest.js";
import { guestResponseDTO } from "../dto/guest.dto.js";
import Room from "#/modules/rooms/models/Room.js";
import Hotel from "#/modules/hotels/models/Hotel.js";
import User from "#/modules/users/models/User.js";
import UserInvite from "#/modules/bookings/models/UserInvite.js";

import {
  generateUsername,
  generateTemporaryPassword,
} from "#/shared/utils/generateCredentials.js";

import { sendGuestCredentialsEmail } from "#/shared/services/email.service.js";

import { generateUploadUrl, deleteObjects } from "#/config/r2.js";

import {
  MAX_FILES,
  validateDocument,
} from "#/shared/middleware/upload.middleware.js";

import { guestProfileDTO } from "../dto/guest.dto.js";
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

// Build a hotel-partitioned, collision-safe R2 object key for a document.
function buildDocumentKey(hotelId, originalname) {
  const unique = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
  const ext = (originalname.match(/\.[^.]*$/) || [""])[0].toLowerCase();

  return `guests/${hotelId}/${unique}${ext}`;
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
// GENERATE PRESIGNED UPLOAD URLS (direct-to-R2)
// =====================================================

export const getDocumentUploadUrls = async (req, res) => {
  try {
    const files = req.body.files;

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one document is required",
      });
    }

    if (files.length > MAX_FILES) {
      return res.status(400).json({
        success: false,
        message: `A maximum of ${MAX_FILES} documents can be uploaded at once`,
      });
    }

    for (const file of files) {
      if (!file?.filename || !file?.mimeType) {
        return res.status(400).json({
          success: false,
          message: "Each document must include a filename and mimeType",
        });
      }

      const validationError = validateDocument(file);

      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError,
        });
      }
    }

    // Files are stored per hotel: guests/<hotelId>/...
    const hotelId = req.user.hotelId;

    const uploads = await Promise.all(
      files.map(async (file) => {
        const key = buildDocumentKey(hotelId, file.filename);

        const uploadUrl = await generateUploadUrl(key, {
          contentType: file.mimeType,
        });

        return {
          key,
          uploadUrl,
          filename: file.filename,
          docType: file.docType || null,
          mimeType: file.mimeType,
          size: file.size,
        };
      }),
    );

    return res.status(200).json({
      success: true,
      message: "Document upload URLs generated successfully",
      data: uploads,
    });
  } catch (error) {
    logger.error(error, "Generate Upload URLs Error");

    return res.status(500).json({
      success: false,
      message: "Failed to generate document upload URLs",
    });
  }
};

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
    // EMAIL MUST NOT ALREADY HAVE AN ACCOUNT
    // =================================================

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      uploadedPaths = resolveDocuments(req).map((d) => d.path);

      await removeFilesQuietly(uploadedPaths);

      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    // =================================================
    // GENERATE CREDENTIALS
    // =================================================

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
      checkIn: checkIn ? new Date(checkIn) : undefined,
      checkOut: new Date(checkOut),
      isActive: true,
      mustChangePassword: false,
    });

    // =================================================
    // CREATE GUEST PROFILE WITH DOCUMENTS
    // =================================================

    const documents = resolveDocuments(req);

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
      documents,
    });

    // =================================================
    // SYNC THE ROOM
    // =================================================

    await claimRoom(room._id, {
      guestName: guest.name,
      checkIn: guest.checkIn,
      checkOut: guest.checkOut,
      reserved: guestStatus === "reserved",
    });

    // =================================================
    // EMAIL THE CREDENTIALS (non-blocking failure)
    // =================================================

    const credentialsEmailSent = await sendCredentialsQuietly({
      email: guest.email,
      name: guest.name,
      username,
      temporaryPassword,
      hotelName: hotel.name,
    });

    logger.info(
      {
        guestId: guest._id,
        username,
        credentialsEmailSent,
      },
      "Guest registered",
    );

    return res.status(201).json({
      success: true,
      message: "Guest registered successfully",
      data: {
        ...(await guestResponseDTO(guest.toJSON())),
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
// LIST GUESTS
// =====================================================

export const getGuests = async (req, res) => {
  try {
    const filter = { hotelId: req.user.hotelId };

    if (
      req.query.status &&
      ["reserved", "checked-in", "checked-out"].includes(req.query.status)
    ) {
      filter.status = req.query.status;
    }

    const guests = await Guest.find(filter)
      .populate("roomId", "roomNumber type rate floor")
      .sort({ createdAt: -1 });

    const data = await Promise.all(
      guests.map((g) =>
        guestResponseDTO(g, {
          room: g.roomId
            ? {
                id: g.roomId._id,
                roomNumber: g.roomId.roomNumber,
                type: g.roomId.type,
                rate: g.roomId.rate,
                floor: g.roomId.floor,
              }
            : null,
        }),
      ),
    );

    return res.status(200).json({
      success: true,
      message: "Guests fetched successfully",
      data,
    });
  } catch (error) {
    logger.error(error, "Get Guests Error");

    return res.status(500).json({
      success: false,
      message: "Failed to fetch guests",
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
      hotelId: req.user.hotelId,
    }).populate("roomId", "roomNumber type rate floor");

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Guest fetched successfully",
      data: await guestResponseDTO(guest, {
        room: guest.roomId
          ? {
              id: guest.roomId._id,
              roomNumber: guest.roomId.roomNumber,
              type: guest.roomId.type,
              rate: guest.roomId.rate,
              floor: guest.roomId.floor,
            }
          : null,
      }),
    });
  } catch (error) {
    logger.error(error, "Get Guest Error");

    return res.status(500).json({
      success: false,
      message: "Failed to fetch guest",
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
      hotelId: req.user.hotelId,
    });

    if (!guest) {
      uploadedPaths = resolveDocuments(req).map((d) => d.path);

      await removeFilesQuietly(uploadedPaths);

      return res.status(404).json({
        success: false,
        message: "Guest not found",
      });
    }

    const allowedFields = ["name", "phone", "address", "idType", "idNumber"];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        guest[field] = req.body[field];
      }
    }

    // Email change must stay unique across users
    if (
      req.body.email !== undefined &&
      req.body.email.trim().toLowerCase() !== guest.email
    ) {
      const clash = await User.findOne({
        email: req.body.email.trim().toLowerCase(),
      });

      if (clash && String(clash._id) !== String(guest.userId)) {
        uploadedPaths = resolveDocuments(req).map((d) => d.path);

        await removeFilesQuietly(uploadedPaths);

        return res.status(409).json({
          success: false,
          message: "Another account already uses this email",
        });
      }

      guest.email = req.body.email.trim().toLowerCase();
    }

    // Optional new documents (JSON edit)
    const newDocuments = resolveDocuments(req);

    uploadedPaths = newDocuments.map((d) => d.path);

    if (newDocuments.length > 0) {
      guest.documents.push(...newDocuments);
    }

    await guest.save();

    // Keep the login account name in sync
    if (req.body.name?.trim()) {
      await User.updateOne(
        { _id: guest.userId },
        { name: req.body.name.trim() },
      );
    }

    // Status transition to checked-out frees the room
    if (req.body.status === "checked-out" && guest.status !== "checked-out") {
      guest.status = "checked-out";

      await guest.save();

      await freeRoom(guest.roomId);
    }

    const populated = await Guest.findById(guest._id).populate(
      "roomId",
      "roomNumber type rate floor",
    );

    return res.status(200).json({
      success: true,
      message: "Guest updated successfully",
      data: await guestResponseDTO(populated, {
        room: populated.roomId
          ? {
              id: populated.roomId._id,
              roomNumber: populated.roomId.roomNumber,
              type: populated.roomId.type,
              rate: populated.roomId.rate,
              floor: populated.roomId.floor,
            }
          : null,
      }),
    });
  } catch (error) {
    logger.error(error, "Update Guest Error");

    await removeFilesQuietly(uploadedPaths);

    return res.status(500).json({
      success: false,
      message: "Failed to update guest",
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
      hotelId: req.user.hotelId,
    });

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest not found",
      });
    }

    const user = await User.findById(guest.userId).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Guest login account not found",
      });
    }

    const regenerate = req.body.action === "regenerate";

    const newPassword = regenerate
      ? generateTemporaryPassword()
      : req.body.password;

    if (!regenerate && (!newPassword || newPassword.length < 8)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
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
        hotelName: hotel?.name || "",
      });
    }

    logger.info({ guestId: guest._id }, "Guest credentials updated");

    return res.status(200).json({
      success: true,
      message: regenerate
        ? "New credentials generated and emailed to the guest"
        : "Password updated successfully",
      data: {
        username: user.username,
        ...(regenerate || req.body.reveal === true
          ? { temporaryPassword: newPassword, emailSent }
          : {}),
      },
    });
  } catch (error) {
    logger.error(error, "Update Guest Credentials Error");

    return res.status(500).json({
      success: false,
      message: "Failed to update guest credentials",
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
      hotelId: req.user.hotelId,
    });

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest not found",
      });
    }

    const document = guest.documents.id(req.params.docId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    guest.documents.pull(document._id);

    await guest.save();

    await removeFilesQuietly([document.path]);

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully",
      data: { id: guest._id, documents: guest.documents },
    });
  } catch (error) {
    logger.error(error, "Delete Guest Document Error");

    return res.status(500).json({
      success: false,
      message: "Failed to delete document",
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
      hotelId: req.user.hotelId,
    });

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest not found",
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
        _id: { $ne: guest._id },
      });

      if (!stillHeld) {
        await freeRoom(roomId);
      }
    }

    logger.info({ guestId: guest._id }, "Guest deleted");

    return res.status(200).json({
      success: true,
      message: "Guest deleted successfully",
    });
  } catch (error) {
    logger.error(error, "Delete Guest Error");

    return res.status(500).json({
      success: false,
      message: "Failed to delete guest",
    });
  }
};

// =====================================================
// GUEST SELF-SERVICE (role GUEST)
// =====================================================

export const getMyProfile = async (req, res) => {
  try {
    const user = req.user;
    let room = null;

    if (user.roomId) {
      room = await Room.findById(user.roomId);
    }

    return res.status(200).json({
      success: true,
      data: guestProfileDTO(user, room),
    });
  } catch (error) {
    logger.error(error, "Get guest profile error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch guest profile" });
  }
};

export const updateDND = async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== "boolean") {
      return res
        .status(400)
        .json({ success: false, message: "enabled (boolean) is required" });
    }

    req.user.dndEnabled = enabled;
    await req.user.save();

    return res
      .status(200)
      .json({ success: true, data: { dndEnabled: req.user.dndEnabled } });
  } catch (error) {
    logger.error(error, "Update DND error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to update Do Not Disturb" });
  }
};
