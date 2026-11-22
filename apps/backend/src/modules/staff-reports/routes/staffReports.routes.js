import { Router } from "express";

import {
  dailyRecords,
  dailyReport,
  exportMonthly,
  lockMonth,
  lockStatus,
  monthlyReport,
  monthlyStaff,
  payrollExport,
  refreshMonth,
  unlockMonth,
  createExport,
  downloadExport,
  listExports,
  previewReport,
} from "../controllers/staffReport.controller.js";

const staffReportsRoutes = Router();

staffReportsRoutes.get("/daily", dailyReport);
staffReportsRoutes.get("/daily/records", dailyRecords);
staffReportsRoutes.get("/monthly", monthlyReport);
staffReportsRoutes.get("/monthly/staff", monthlyStaff);
staffReportsRoutes.get("/monthly/export", exportMonthly);

staffReportsRoutes.get("/monthly/payroll", payrollExport);
staffReportsRoutes.get("/monthly/lock", lockStatus);
staffReportsRoutes.post("/monthly/lock", lockMonth);
staffReportsRoutes.post("/monthly/unlock", unlockMonth);
staffReportsRoutes.post("/monthly/refresh", refreshMonth);

staffReportsRoutes.post("/export/preview", previewReport);
staffReportsRoutes.post("/export", createExport);
staffReportsRoutes.get("/export/history", listExports);
staffReportsRoutes.get("/export/history/:id/download", downloadExport);

export default staffReportsRoutes;
