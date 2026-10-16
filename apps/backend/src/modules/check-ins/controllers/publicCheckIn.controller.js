import crypto from "crypto";

import CheckInSession from "../models/CheckInSession.js";
import { publicCheckInSessionDTO } from "../dto/checkIn.dto.js";
import { hashToken } from "../services/token.service.js";
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
