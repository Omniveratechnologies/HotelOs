import express from "express";

import {
  getRatePlans,
  createRatePlan,
  updateRatePlan,
  deleteRatePlan,
  syncAllRates,
} from "../controllers/ratePlan.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";

const router = express.Router();

// Read — SUB_ADMIN + RECEPTIONIST
router.get(
  "/",
  authenticate,
  authorize("SUB_ADMIN", "RECEPTIONIST"),
  getRatePlans,
);

// Sync all rates to Aiosell (before parameterized routes)
router.post("/sync", authenticate, authorize("SUB_ADMIN"), syncAllRates);

// Write — SUB_ADMIN only
router.post("/", authenticate, authorize("SUB_ADMIN"), createRatePlan);
router.patch("/:id", authenticate, authorize("SUB_ADMIN"), updateRatePlan);
router.delete("/:id", authenticate, authorize("SUB_ADMIN"), deleteRatePlan);

export default router;
