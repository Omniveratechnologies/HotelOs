import express from "express";
import {
  createQrGuestSession,
  exchangeKioskHandoff,
  validateCurrentSession,
  revokeCurrentSession,
} from "../controllers/session.controller.js";
import { authenticateSession } from "#/shared/middleware/sessionAuth.middleware.js";
import { createRateLimiter } from "#/shared/middleware/rateLimiter.middleware.js";

const router = express.Router();

const sessionCreateLimiter = createRateLimiter({
  prefix: "session-create",
  windowMs: 60000,
  max: 10,
  message:
    "Too many session creation attempts. Please wait 1 minute before retrying.",
});

// Public endpoints to establish sessions
router.post("/qr-guest", sessionCreateLimiter, createQrGuestSession);
router.post("/kiosk-exchange", sessionCreateLimiter, exchangeKioskHandoff);

// Authenticated session state endpoints
router.get(
  "/validate",
  authenticateSession({ requireLocation: false }),
  validateCurrentSession,
);
router.post(
  "/revoke",
  authenticateSession({ requireLocation: false }),
  revokeCurrentSession,
);

export default router;
