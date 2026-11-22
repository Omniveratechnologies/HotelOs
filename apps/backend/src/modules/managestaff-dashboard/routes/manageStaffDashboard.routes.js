import { Router } from "express";

import { dashboard } from "../controllers/manageStaffDashboard.controller.js";

const manageStaffDashboardRoutes = Router();

manageStaffDashboardRoutes.get("/", dashboard);

export default manageStaffDashboardRoutes;