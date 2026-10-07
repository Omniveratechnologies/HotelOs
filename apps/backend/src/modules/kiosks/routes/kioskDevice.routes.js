import express from "express";
import {
  getKioskDevices,
  createKioskDevice,
  updateKioskDevice,
  regeneratePairCode,
  deleteKioskDevice,
} from "../controllers/kioskDevice.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";

const router = express.Router();

router.use(authenticate, authorize("SUB_ADMIN", "RECEPTIONIST"));

router.get("/", getKioskDevices);
router.post("/", createKioskDevice);
router.patch("/:id", updateKioskDevice);
router.post("/:id/regenerate-pair-code", regeneratePairCode);
router.delete("/:id", deleteKioskDevice);

export default router;
