import crypto from "crypto";

import User from "#/modules/users/models/User.js";
import Room from "#/modules/rooms/models/Room.js";
import Booking from "#/modules/bookings/models/Booking.js";

import { generateTemporaryPassword } from "#/shared/utils/generateCredentials.js";

import { sendGuestCredentialsEmail } from "#/shared/services/email.service.js";

import { generateUploadUrl, deleteObjects } from "#/config/r2.js";

import {
  MAX_FILES,
  validateDocument,
} from "#/shared/middleware/upload.middleware.js";

import { guestProfileDTO } from "../dto/guest.dto.js";

import Hotel from "#/modules/hotels/models/Hotel.js";
import logger from "#/utils/logger.js";

// =====================================================
// HELPERS
// =====================================================

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
// UPDATE GUEST PROFILE (identity)
// =====================================================

export const updateGuest = async (req, res) => {
  let uploadedPaths = [];

  try {
    const guest = await User.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId,
      role: "GUEST",
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

    // Email change must not clash with a non-guest account (guests may share
    // an email across separate stays)
    if (
      req.body.email !== undefined &&
      req.body.email.trim().toLowerCase() !== guest.email
    ) {
      const clash = await User.findOne({
        email: req.body.email.trim().toLowerCase(),
        role: { $ne: "GUEST" },
      });

      if (clash && String(clash._id) !== String(guest._id)) {
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

    // Keep the active room display name in sync
    if (req.body.name?.trim()) {
      const activeBooking = await Booking.findOne({
        guestId: guest._id,
        status: { $in: ["reserved", "checked-in"] },
      });

      if (activeBooking) {
        await Room.updateOne(
          { _id: activeBooking.roomId },
          { currentGuest: guest.name },
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Guest updated successfully",
      data: guest.toObject(),
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
    const guest = await User.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId,
      role: "GUEST",
    });

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest not found",
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

    guest.password = newPassword;

    await guest.save();

    const hotel = await Hotel.findById(req.user.hotelId).select("name");

    let emailSent = false;

    if (regenerate) {
      emailSent = await sendCredentialsQuietly({
        email: guest.email,
        name: guest.name,
        username: guest.username,
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
        username: guest.username,
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
    const guest = await User.findOne({
      _id: req.params.guestId,
      hotelId: req.user.hotelId,
      role: "GUEST",
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
// GUEST SELF-SERVICE (role GUEST)
// =====================================================

export const getMyProfile = async (req, res) => {
  try {
    const user = req.user;
    const booking = req.currentBooking || null;
    let room = null;

    if (booking?.roomId) {
      room = await Room.findById(booking.roomId);
    }

    return res.status(200).json({
      success: true,
      data: guestProfileDTO(user, booking, room),
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

    const booking = req.currentBooking;

    if (!booking) {
      return res.status(400).json({
        success: false,
        message: "No active booking found for this guest",
      });
    }

    booking.dndEnabled = enabled;
    await booking.save();

    return res
      .status(200)
      .json({ success: true, data: { dndEnabled: booking.dndEnabled } });
  } catch (error) {
    logger.error(error, "Update DND error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to update Do Not Disturb" });
  }
};
