import express from "express";
import { rateLimit } from "express-rate-limit";
import {
  getKioskDevices,
  createKioskDevice,
  updateKioskDevice,
  regeneratePairCode,
  deleteKioskDevice,
  sendKioskRemoteCommand,
  pairKiosk,
  kioskHeartbeat,
  getKioskStatus,
  getKioskDashboards,
  createKioskHandoffCode,
} from "../controllers/kioskDevice.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";

const router = express.Router();

// Rate limiter for kiosk pairing (5 attempts per 15 minutes per IP)
const kioskPairLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: "Too many pairing attempts. Please wait before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// =====================================================
// DEVICE ENDPOINTS (Terminal Setup & Heartbeat)
// =====================================================
router.post("/pair", kioskPairLimiter, pairKiosk);
router.post("/heartbeat", authenticate, kioskHeartbeat);
router.get("/status", authenticate, getKioskStatus);
router.post("/handoff-code", authenticate, createKioskHandoffCode);

// =====================================================
// MANAGEMENT ENDPOINTS
// - List & Dashboards: Super Admin, Sub-Admin, Receptionist
// - All setup/mutations: Restricted to SUPER_ADMIN
// =====================================================
router.get(
  "/dashboards",
  authenticate,
  authorize("SUPER_ADMIN", "SUB_ADMIN", "RECEPTIONIST"),
  getKioskDashboards,
);
router.get(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "SUB_ADMIN", "RECEPTIONIST"),
  getKioskDevices,
);
router.post("/", authenticate, authorize("SUPER_ADMIN"), createKioskDevice);
router.patch(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN", "SUB_ADMIN", "RECEPTIONIST"),
  updateKioskDevice,
);
router.post(
  "/:id/regenerate-pair-code",
  authenticate,
  authorize("SUPER_ADMIN"),
  regeneratePairCode,
);
router.post(
  "/:id/command",
  authenticate,
  authorize("SUPER_ADMIN"),
  sendKioskRemoteCommand,
);
router.delete(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN"),
  deleteKioskDevice,
);

export default router;
