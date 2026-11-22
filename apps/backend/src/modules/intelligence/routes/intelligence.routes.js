import express from "express";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";
import {
  getIntelligenceDashboard,
  updateIntelligenceRecommendation,
} from "#/modules/intelligence/controllers/intelligence.controller.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize("SUB_ADMIN"));

router.post("/bi/recommendations/:id", updateIntelligenceRecommendation);
router.get("/:module/:dashboard", getIntelligenceDashboard);

export default router;
