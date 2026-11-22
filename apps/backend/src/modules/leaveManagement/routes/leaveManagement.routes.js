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
import { validate } from "#/shared/middleware/validate.middleware.js";
import {
  applyLeaveBodySchema,
  approveLeaveBodySchema,
  rejectLeaveBodySchema,
  cancelLeaveBodySchema,
  listLeavesQuerySchema,
  leaveStatsQuerySchema,
  listLeaveTypesQuerySchema,
  staffLeaveBalanceQuerySchema,
  listNotificationsQuerySchema,
  markNotificationsReadBodySchema,
  leaveIdParamsSchema,
  staffIdParamsSchema,
} from "../schemas.js";

const leaveManagementRoutes = Router();

leaveManagementRoutes.get(
  "/",
  validate({ query: listLeavesQuerySchema }),
  listLeaves,
);
leaveManagementRoutes.get(
  "/stats",
  validate({ query: leaveStatsQuerySchema }),
  leaveStats,
);
leaveManagementRoutes.get(
  "/types",
  validate({ query: listLeaveTypesQuerySchema }),
  listLeaveTypes,
);
leaveManagementRoutes.get(
  "/notifications",
  validate({ query: listNotificationsQuerySchema }),
  listNotifications,
);
leaveManagementRoutes.post(
  "/notifications/read",
  validate({ body: markNotificationsReadBodySchema }),
  markNotificationsRead,
);
leaveManagementRoutes.get(
  "/staff/:id/leave-balance",
  validate({
    params: staffIdParamsSchema,
    query: staffLeaveBalanceQuerySchema,
  }),
  staffLeaveBalance,
);

leaveManagementRoutes.post(
  "/",
  validate({ body: applyLeaveBodySchema }),
  applyLeave,
);
leaveManagementRoutes.get(
  "/:id",
  validate({ params: leaveIdParamsSchema }),
  getLeave,
);
leaveManagementRoutes.post(
  "/:id/approve",
  validate({ params: leaveIdParamsSchema, body: approveLeaveBodySchema }),
  approveLeave,
);
leaveManagementRoutes.post(
  "/:id/reject",
  validate({ params: leaveIdParamsSchema, body: rejectLeaveBodySchema }),
  rejectLeave,
);
leaveManagementRoutes.post(
  "/:id/cancel",
  validate({ params: leaveIdParamsSchema, body: cancelLeaveBodySchema }),
  cancelLeave,
);

export default leaveManagementRoutes;
