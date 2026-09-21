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

// Read + manage — SUB_ADMIN + RECEPTIONIST
router.use(authenticate, authorize("SUB_ADMIN", "RECEPTIONIST"));

// Sync all rates to Aiosell (before parameterized routes)
router.post("/sync", syncAllRates);

// Read + write (create/update/delete)
router.get("/", getRatePlans);
router.post("/", createRatePlan);
router.patch("/:id", updateRatePlan);
router.delete("/:id", deleteRatePlan);

export default router;
