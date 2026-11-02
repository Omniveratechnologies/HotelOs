import { Router } from "express";
import {
  listLeaves,
  leaveStats,
  listLeaveTypes,
  staffLeaveBalance,
  listNotifications,
  markNotificationsRead,
  getLeave,
  applyLeave,
  approveLeave,
  rejectLeave,
  cancelLeave,
} from "../controllers/leave.controller.js";

const leaveManagementRoutes = Router();

leaveManagementRoutes.get("/", listLeaves);
leaveManagementRoutes.get("/stats", leaveStats);
leaveManagementRoutes.get("/types", listLeaveTypes);
leaveManagementRoutes.get("/notifications", listNotifications);
leaveManagementRoutes.post("/notifications/read", markNotificationsRead);
leaveManagementRoutes.get("/staff/:id/leave-balance", staffLeaveBalance);

leaveManagementRoutes.post("/", applyLeave);
leaveManagementRoutes.get("/:id", getLeave);
leaveManagementRoutes.post("/:id/approve", approveLeave);
leaveManagementRoutes.post("/:id/reject", rejectLeave);
leaveManagementRoutes.post("/:id/cancel", cancelLeave);

export default leaveManagementRoutes;
