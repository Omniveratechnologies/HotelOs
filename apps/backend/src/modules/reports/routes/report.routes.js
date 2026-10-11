import express from "express";
import { getReportData } from "../controllers/report.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";

const router = express.Router();

// All report routes require authentication and receptionist+ role
router.use(authenticate);
router.use(authorize("SUPER_ADMIN", "SUB_ADMIN", "RECEPTIONIST"));

/**
 * @route GET /api/v1/reports/dashboard
 * @description Get comprehensive hotel report data with date range filtering
 * @query period - today, week, month, custom
 * @query startDate - YYYY-MM-DD (for custom period)
 * @query endDate - YYYY-MM-DD (for custom period)
 */
router.get("/dashboard", getReportData);

export default router;
