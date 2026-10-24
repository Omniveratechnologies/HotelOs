import express from "express";
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
} from "../controllers/kioskDevice.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";

const router = express.Router();

// =====================================================
// DEVICE ENDPOINTS (Terminal Setup & Heartbeat)
// =====================================================
router.post("/pair", pairKiosk);
router.post("/heartbeat", authenticate, kioskHeartbeat);
router.get("/status", authenticate, getKioskStatus);

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
