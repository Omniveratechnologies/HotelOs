import express from "express";
import { getDashboardStats } from "../controllers/dashboard.controller.js";
import { authenticate } from "#src/shared/middleware/auth.middleware.js";
import { authorize } from "#src/shared/middleware/role.middleware.js";

const router = express.Router();

router.get(
  "/stats",
  authenticate,
  authorize("SUPER_ADMIN", "SUB_ADMIN", "RECEPTIONIST"),
  getDashboardStats,
);

export default router;
