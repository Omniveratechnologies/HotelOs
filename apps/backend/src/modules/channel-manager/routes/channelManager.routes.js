import express from "express";

import { handleWebhook } from "../webhooks/webhook.controller.js";
import { validateBasicAuth } from "../webhooks/middleware/basicAuth.middleware.js";
import {
  getChannelManagerConfig,
  updateChannelManagerConfig,
} from "../config/config.controller.js";
import {
  getLiveRates,
  updateRates,
  updateRateRestrictions,
  getLiveInventory,
  updateInventory,
  updateInventoryRestrictions,
  markNoShow,
} from "../distribution/distribution.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";
import { validate } from "#/shared/middleware/validate.middleware.js";
import {
  getLiveRatesQuerySchema,
  getLiveInventoryQuerySchema,
  updateRatesBodySchema,
  updateRateRestrictionsBodySchema,
  updateInventoryBodySchema,
  updateInventoryRestrictionsBodySchema,
  markNoShowBodySchema,
} from "../distribution/distribution.schemas.js";

const router = express.Router();

// Aiosell webhook endpoint — Basic Auth only, no JWT.
router.post("/webhook", validateBasicAuth, handleWebhook);

// Configuration (Super Admin)
router.get(
  "/config",
  authenticate,
  authorize("SUPER_ADMIN"),
  getChannelManagerConfig,
);
router.post(
  "/config",
  authenticate,
  authorize("SUPER_ADMIN"),
  updateChannelManagerConfig,
);

// Distribution: Live Rates & Inventory direct exchange with Aiosell
router.get(
  "/distribution/rates",
  authenticate,
  authorize("SUPER_ADMIN", "SUB_ADMIN", "RECEPTIONIST"),
  validate({ query: getLiveRatesQuerySchema }),
  getLiveRates,
);
router.post(
  "/distribution/rates",
  authenticate,
  authorize("SUPER_ADMIN", "SUB_ADMIN", "RECEPTIONIST"),
  validate({ body: updateRatesBodySchema }),
  updateRates,
);
router.post(
  "/distribution/rate-restrictions",
  authenticate,
  authorize("SUPER_ADMIN", "SUB_ADMIN", "RECEPTIONIST"),
  validate({ body: updateRateRestrictionsBodySchema }),
  updateRateRestrictions,
);

router.get(
  "/distribution/inventory",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate({ query: getLiveInventoryQuerySchema }),
  getLiveInventory,
);
router.post(
  "/distribution/inventory",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate({ body: updateInventoryBodySchema }),
  updateInventory,
);
router.post(
  "/distribution/inventory-restrictions",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate({ body: updateInventoryRestrictionsBodySchema }),
  updateInventoryRestrictions,
);

router.post(
  "/distribution/mark-noshow",
  authenticate,
  authorize("SUPER_ADMIN", "SUB_ADMIN", "RECEPTIONIST"),
  validate({ body: markNoShowBodySchema }),
  markNoShow,
);

export default router;
