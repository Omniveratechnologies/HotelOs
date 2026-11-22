import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  createCheckInLink,
  getCheckInSessions,
  getCheckInSession,
  resendCheckInLink,
  approveCheckIn,
  rejectCheckIn,
  requestCheckInCorrection,
} from "../controllers/checkIn.controller.js";
import {
  resolveCheckIn,
  saveCheckInStep,
  getCheckInUploadUrls,
  submitCheckIn,
  lookupBookingForCheckIn,
  verifyCheckInOtp,
} from "../controllers/publicCheckIn.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";

// Receptionist (authenticated) check-in session routes.
export const checkInRouter = Router();
checkInRouter.use(authenticate, authorize("SUB_ADMIN", "RECEPTIONIST"));

checkInRouter.post("/links", createCheckInLink);
checkInRouter.post("/links/:id/resend", resendCheckInLink);
checkInRouter.get("/sessions", getCheckInSessions);
checkInRouter.get("/sessions/:id", getCheckInSession);
checkInRouter.post("/sessions/:id/approve", approveCheckIn);
checkInRouter.post("/sessions/:id/reject", rejectCheckIn);
checkInRouter.post(
  "/sessions/:id/request-correction",
  requestCheckInCorrection,
);

// Rate limiter for public kiosk endpoints (5 requests per 15 minutes per IP)
const kioskLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: "Too many requests. Please wait before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public token-scoped and kiosk guest check-in routes.
export const publicCheckInRouter = Router();
publicCheckInRouter.post("/lookup", kioskLimiter, lookupBookingForCheckIn);
publicCheckInRouter.post("/verify-otp", kioskLimiter, verifyCheckInOtp);
publicCheckInRouter.get("/:token", resolveCheckIn);
publicCheckInRouter.put("/:token/steps/:step", saveCheckInStep);
publicCheckInRouter.post("/:token/uploads", getCheckInUploadUrls);
publicCheckInRouter.post("/:token/submit", submitCheckIn);
