import express from "express";
import {
  createQrGuestSession,
  exchangeKioskHandoff,
  getKioskRoomStatus,
  validateCurrentSession,
  revokeCurrentSession,
} from "../controllers/session.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authenticateSession } from "#/shared/middleware/sessionAuth.middleware.js";
import { createRateLimiter } from "#/shared/middleware/rateLimiter.middleware.js";

const router = express.Router();

// Rate limiter for initial session establishment endpoints.
// Configured to 60 req/min to safely accommodate hotel LAN kiosk terminals and dining tables
// sharing NAT gateway IP addresses during concurrent guest traffic or rapid initial testing cycles.
const sessionCreateLimiter = createRateLimiter({
  prefix: "session-create",
  windowMs: 60000,
  max: 60,
  message:
    "Too many session creation attempts. Please wait 1 minute before retrying.",
});

// Public endpoints to establish sessions
router.post("/qr-guest", sessionCreateLimiter, createQrGuestSession);
router.post("/kiosk-exchange", sessionCreateLimiter, exchangeKioskHandoff);

// Authenticated kiosk room stay check (idempotent, safe on reload)
router.get("/kiosk-room-status", authenticate, getKioskRoomStatus);

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
