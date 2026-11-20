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
import { validate } from "#/shared/middleware/validate.middleware.js";
import {
  createRatePlanBodySchema,
  updateRatePlanBodySchema,
  syncAllRatesBodySchema,
  ratePlanIdParamsSchema,
} from "../schemas.js";

const router = express.Router();

// Read + manage — SUB_ADMIN + RECEPTIONIST
router.use(authenticate, authorize("SUB_ADMIN", "RECEPTIONIST"));

// Sync all rates to Aiosell (before parameterized routes)
router.post("/sync", validate({ body: syncAllRatesBodySchema }), syncAllRates);

// Read + write (create/update/delete)
router.get("/", getRatePlans);
router.post("/", validate({ body: createRatePlanBodySchema }), createRatePlan);
router.patch(
  "/:id",
  validate({ params: ratePlanIdParamsSchema, body: updateRatePlanBodySchema }),
  updateRatePlan,
);
router.delete(
  "/:id",
  validate({ params: ratePlanIdParamsSchema }),
  deleteRatePlan,
);

export default router;
