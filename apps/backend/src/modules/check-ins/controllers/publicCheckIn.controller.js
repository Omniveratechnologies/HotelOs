import crypto from "crypto";
import mongoose from "mongoose";

import CheckInSession from "../models/CheckInSession.js";
import Booking from "#/modules/bookings/models/Booking.js";
import User from "#/modules/users/models/User.js";
import { publicCheckInSessionDTO } from "../dto/checkIn.dto.js";
import { hashToken, createSessionToken } from "../services/token.service.js";
import { sendCheckInOtpEmail } from "#/shared/services/email.service.js";
import { generateUploadUrl } from "#/config/r2.js";
import {
  ALLOWED_MIME_TYPES,
  validateDocument,
} from "#/shared/middleware/upload.middleware.js";
import logger from "#/utils/logger.js";

// Public guest self check-in (token-authenticated, no JWT).

function buildCheckInKey(hotelId, sessionId, originalname) {
  const unique = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
  const ext = (originalname.match(/\.[^.]*$/) || [""])[0].toLowerCase();
  return `checkins/${hotelId}/${sessionId}/${unique}${ext}`;
}

// Resolve a session by raw token (404/410-safe; never leaks existence).
async function sessionByToken(req, res) {
  const session = await CheckInSession.findOne({
    tokenHash: hashToken(req.params.token),
  }).populate({
    path: "reservationId",
    populate: ["guestId", "roomId"],
  });

  if (!session) {
    res
      .status(404)
      .json({ success: false, message: "This check-in link is invalid" });
    return null;
  }

  if (session.expiresAt && new Date() > session.expiresAt) {
    if (session.status !== "expired") {
      session.status = "expired";
      session.auditTrail.push({ action: "expired", note: "Link expired" });
      await session.save();
    }
    res.status(410).json({
      success: false,
      message: "This check-in link is no longer valid",
    });
    return null;
  }

  if (session.status === "approved" && req.method !== "GET") {
    res.status(409).json({
      success: false,
      message: "This check-in has already been approved",
    });
    return null;
  }
  if (session.status === "rejected" && req.method !== "GET") {
    res.status(409).json({
      success: false,
      message: "This check-in was rejected. Please contact reception.",
    });
    return null;
  }

  return session;
}

// Mutable step payloads the guest may submit.
const STEP_FIELDS = {
  guest: ["guestName", "email", "phone", "nationality", "dateOfBirth"],
  id: ["idType", "idNumber", "idFront", "idBack"],
  photo: ["selfie"],
  signature: ["signature", "termsAcceptedAt"],
  preferences: ["preferences", "remarks"],
};

const STEP_INDEX = {
  welcome: 1,
  booking: 2,
  guest: 3,
  id: 4,
  photo: 5,
  "registration-card": 6,
  signature: 7,
  preferences: 8,
  review: 9,
  success: 10,
};

function sanitizeFileRef(file, hotelId, sessionId) {
  if (!file?.key || !file?.filename) return null;
  if (typeof file.key !== "string") return null;
  // Keys must live inside this session's namespace.
  if (!file.key.startsWith(`checkins/${hotelId}/${sessionId}/`)) return null;
  return {
    key: file.key,
    filename: String(file.filename).slice(0, 200),
    mimeType: String(file.mimeType || ""),
    size: Number(file.size) || 0,
    uploadedAt: new Date(),
  };
}

// =====================================================
// RESOLVE SESSION (guest landing / resume)
// =====================================================

export const resolveCheckIn = async (req, res) => {
  try {
    const session = await sessionByToken(req, res);
    if (!session) return;

    return res.status(200).json({
      success: true,
      message: "Check-in session resolved",
      data: await publicCheckInSessionDTO(session),
    });
  } catch (error) {
    logger.error(error, "Resolve Check-in Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to load check-in" });
  }
};

// =====================================================
// SAVE STEP (progress persisted server-side, resumable)
// =====================================================

export const saveCheckInStep = async (req, res) => {
  try {
    const session = await sessionByToken(req, res);
    if (!session) return;

    const stepKey = String(req.params.step);
    const stepIndex = STEP_INDEX[stepKey];
    if (!stepIndex || stepIndex < 3) {
      return res.status(400).json({ success: false, message: "Unknown step" });
    }
    if (stepKey === "review" || stepKey === "success") {
      return res.status(400).json({
        success: false,
        message: "This step is not editable directly",
      });
    }

    const allowed = STEP_FIELDS[stepKey];
    if (!allowed) {
      return res.status(400).json({ success: false, message: "Unknown step" });
    }

    const incoming = req.body || {};
    for (const field of allowed) {
      if (incoming[field] === undefined) continue;

      if (["idFront", "idBack", "selfie", "signature"].includes(field)) {
        const ref = sanitizeFileRef(
          incoming[field],
          session.hotelId,
          session._id,
        );
        if (incoming[field] && !ref) {
          return res.status(400).json({
            success: false,
            message: `Invalid ${field} file reference`,
          });
        }
        session.stepData[field] = ref;
        continue;
      }

      if (field === "termsAcceptedAt") {
        session.stepData.termsAcceptedAt = incoming[field]
          ? new Date(incoming[field])
          : null;
        continue;
      }

      if (field === "preferences") {
        session.stepData.preferences = Array.isArray(incoming[field])
          ? incoming[field].map((p) => String(p).slice(0, 60)).slice(0, 10)
          : [];
        continue;
      }

      session.stepData[field] = String(incoming[field] ?? "").slice(0, 500);
    }

    session.stepData.ip = req.ip || null;
    session.stepData.userAgent = req.headers["user-agent"] || null;
    session.currentStep = Math.max(session.currentStep, stepIndex + 1);

    if (
      session.status === "link-sent" ||
      session.status === "correction-requested"
    ) {
      session.status = "in-progress";
    }
    session.auditTrail.push({ action: `step-${stepKey}`, note: null });

    await session.save();

    return res.status(200).json({
      success: true,
      message: "Step saved",
      data: await publicCheckInSessionDTO(session),
    });
  } catch (error) {
    logger.error(error, "Save Check-in Step Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to save step" });
  }
};

// =====================================================
// UPLOAD URLS (direct-to-R2 presigned PUT)
// =====================================================

export const getCheckInUploadUrls = async (req, res) => {
  try {
    const session = await sessionByToken(req, res);
    if (!session) return;

    const files = Array.isArray(req.body.files) ? req.body.files : [];
    if (!files.length || files.length > 4) {
      return res.status(400).json({
        success: false,
        message: "Provide 1–4 files",
      });
    }

    for (const f of files) {
      const err = validateDocument({ mimeType: f.mimeType, size: f.size });
      if (err) {
        return res.status(400).json({ success: false, message: err });
      }
      if (!ALLOWED_MIME_TYPES.includes(f.mimeType)) {
        return res.status(400).json({
          success: false,
          message: "Only JPG, PNG, WEBP and PDF files are allowed",
        });
      }
    }

    const uploads = await Promise.all(
      files.map(async (file) => {
        const key = buildCheckInKey(
          session.hotelId,
          session._id,
          file.filename || "file",
        );
        return {
          key,
          uploadUrl: await generateUploadUrl(key, {
            contentType: file.mimeType,
          }),
          filename: file.filename,
          mimeType: file.mimeType,
          size: file.size,
        };
      }),
    );

    return res.status(200).json({
      success: true,
      message: "Upload URLs generated",
      data: uploads,
    });
  } catch (error) {
    logger.error(error, "Check-in Upload URLs Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to generate upload URLs" });
  }
};

// =====================================================
// SUBMIT (guest finished all steps)
// =====================================================

export const submitCheckIn = async (req, res) => {
  try {
    const session = await sessionByToken(req, res);
    if (!session) return;

    const d = session.stepData || {};
    const missing = [];
    if (!d.guestName || !d.phone) missing.push("guest");
    if (!d.idType || !d.idNumber || !d.idFront) missing.push("id");
    if (!d.selfie) missing.push("photo");
    if (!d.signature || !d.termsAcceptedAt) missing.push("signature");

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Complete these steps first: ${missing.join(", ")}`,
      });
    }

    if (session.status === "submitted") {
      return res.status(200).json({
        success: true,
        message: "Check-in already submitted",
        data: await publicCheckInSessionDTO(session),
      });
    }

    session.status = "submitted";
    session.submittedAt = new Date();
    session.currentStep = 10;
    session.auditTrail.push({ action: "submitted", note: null });
    await session.save();

    return res.status(200).json({
      success: true,
      message: "Check-in submitted for verification",
      data: await publicCheckInSessionDTO(session),
    });
  } catch (error) {
    logger.error(error, "Submit Check-in Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to submit check-in" });
  }
};

// =====================================================
// KIOSK / PUBLIC BOOKING LOOKUP & OTP VERIFICATION
// =====================================================

function maskEmail(email) {
  if (!email || typeof email !== "string") return "";
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const [local, domain] = parts;
  if (local.length <= 2) {
    return `${local[0] || "*"}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

function expiresAtFor(reservation) {
  const expiresAt = new Date(reservation.checkOut);
  expiresAt.setHours(23, 59, 59, 999);
  return expiresAt;
}

/**
 * Public kiosk endpoint to look up an active booking by booking ID,
 * reservation number, or guest email, and dispatch an email OTP.
 */
export const lookupBookingForCheckIn = async (req, res) => {
  try {
    const { identifier } = req.body || {};
    if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter your Booking ID or registered Email address",
      });
    }

    const cleanInput = identifier.trim();
    let bookingQuery = null;

    if (mongoose.Types.ObjectId.isValid(cleanInput)) {
      bookingQuery = { _id: cleanInput };
    } else if (cleanInput.includes("@")) {
      const user = await User.findOne({
        email: cleanInput.toLowerCase(),
      }).select("_id");
      if (user) {
        bookingQuery = { guestId: user._id };
      }
    }

    if (!bookingQuery) {
      bookingQuery = { reservationNo: cleanInput.toUpperCase() };
    }

    const booking = await Booking.findOne({
      ...bookingQuery,
      status: { $in: ["confirmed", "reserved"] },
    })
      .sort({ checkIn: -1 })
      .populate("guestId", "name email phone")
      .populate("hotelId", "name checkInTime");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message:
          "No active reservation found for the provided details. Please check your information or visit the front desk.",
      });
    }

    const guestEmail = booking.guestId?.email;
    if (!guestEmail) {
      return res.status(400).json({
        success: false,
        message:
          "No email address is linked to this reservation. Please see the front desk for check-in assistance.",
      });
    }

    // Check if stay check-out has already passed
    const now = new Date();
    const endOfStay = new Date(booking.checkOut);
    endOfStay.setHours(23, 59, 59, 999);
    if (now > endOfStay) {
      return res.status(400).json({
        success: false,
        message:
          "This reservation has already ended. Please see the reception desk.",
      });
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Find or create session
    let session = await CheckInSession.findOne({ reservationId: booking._id });
    if (!session) {
      const { tokenHash } = createSessionToken();
      session = new CheckInSession({
        hotelId: booking.hotelId._id,
        reservationId: booking._id,
        tokenHash,
        expiresAt: expiresAtFor(booking),
        status: "link-sent",
        sentVia: "EMAIL",
      });
    }

    session.otpHash = otpHash;
    session.otpExpiresAt = otpExpiresAt;
    session.otpAttempts = 0;
    session.auditTrail.push({
      action: "kiosk-otp-requested",
      note: `Verification code generated at kiosk`,
    });

    await session.save();

    // Dispatch verification code to guest email
    await sendCheckInOtpEmail({
      email: guestEmail,
      name: booking.guestId.name || "Guest",
      otp,
      hotelName: booking.hotelId?.name || "HotelOS",
    });

    logger.info(
      { bookingId: booking._id, guestEmail },
      "Kiosk check-in verification OTP dispatched",
    );

    return res.status(200).json({
      success: true,
      message: "Verification code sent to your email",
      data: {
        reservationId: booking._id,
        maskedEmail: maskEmail(guestEmail),
      },
    });
  } catch (error) {
    logger.error(error, "Kiosk lookup check-in error");
    return res.status(500).json({
      success: false,
      message:
        "Failed to look up reservation. Please try again or visit reception.",
    });
  }
};

/**
 * Public kiosk endpoint to verify the 6-digit OTP code and return the check-in session token.
 */
export const verifyCheckInOtp = async (req, res) => {
  try {
    const { reservationId, code } = req.body || {};

    if (!reservationId || !code) {
      return res.status(400).json({
        success: false,
        message: "Reservation ID and 6-digit verification code are required",
      });
    }

    const session = await CheckInSession.findOne({ reservationId }).populate({
      path: "reservationId",
      populate: ["guestId", "roomId"],
    });

    if (!session || !session.otpHash) {
      return res.status(404).json({
        success: false,
        message:
          "No active verification request found. Please request a new code.",
      });
    }

    if (session.otpAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message:
          "Too many failed attempts. Please request a new verification code.",
      });
    }

    if (new Date() > new Date(session.otpExpiresAt)) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new code.",
      });
    }

    const providedHash = crypto
      .createHash("sha256")
      .update(String(code).trim())
      .digest("hex");

    if (providedHash !== session.otpHash) {
      session.otpAttempts = (session.otpAttempts || 0) + 1;
      await session.save();
      const remainingAttempts = Math.max(0, 5 - session.otpAttempts);
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
      });
    }

    // Successful verification: clear OTP and generate fresh session token
    const { token, tokenHash } = createSessionToken();
    session.tokenHash = tokenHash;
    session.otpHash = null;
    session.otpExpiresAt = null;
    session.otpAttempts = 0;
    session.status =
      session.status === "link-sent" ? "in-progress" : session.status;
    session.auditTrail.push({
      action: "kiosk-verified",
      note: "Successfully verified identity via email OTP at kiosk",
    });

    await session.save();

    logger.info(
      { sessionId: session._id, reservationId },
      "Kiosk OTP verified successfully",
    );

    return res.status(200).json({
      success: true,
      message: "Identity verified successfully",
      data: {
        token,
        session: await publicCheckInSessionDTO(session),
      },
    });
  } catch (error) {
    logger.error(error, "Kiosk OTP verification error");
    return res.status(500).json({
      success: false,
      message: "Verification failed. Please try again.",
    });
  }
};
