import { Router } from "express";
import {
  summary,
  listShifts,
  getShift,
  createShift,
  updateShift,
  deleteShift,
  listSchedule,
  calendar,
  roster,
  assign,
  bulkAssign,
  autoSchedule,
  clearSchedule,
  report,
} from "../controllers/shift.controller.js";
import { validate } from "#/shared/middleware/validate.middleware.js";
import {
  createShiftBodySchema,
  updateShiftBodySchema,
  listShiftsQuerySchema,
  listScheduleQuerySchema,
  calendarQuerySchema,
  rosterQuerySchema,
  assignBodySchema,
  bulkAssignBodySchema,
  autoScheduleBodySchema,
  clearScheduleBodySchema,
  reportQuerySchema,
  summaryQuerySchema,
  shiftIdParamsSchema,
} from "../schemas.js";

const shiftScheduleRoutes = Router();

shiftScheduleRoutes.get(
  "/summary",
  validate({ query: summaryQuerySchema }),
  summary,
);
shiftScheduleRoutes.get(
  "/reports",
  validate({ query: reportQuerySchema }),
  report,
);

shiftScheduleRoutes.get(
  "/shifts",
  validate({ query: listShiftsQuerySchema }),
  listShifts,
);
shiftScheduleRoutes.post(
  "/shifts",
  validate({ body: createShiftBodySchema }),
  createShift,
);
shiftScheduleRoutes.get(
  "/shifts/:id",
  validate({ params: shiftIdParamsSchema }),
  getShift,
);
shiftScheduleRoutes.put(
  "/shifts/:id",
  validate({ params: shiftIdParamsSchema, body: updateShiftBodySchema }),
  updateShift,
);
shiftScheduleRoutes.delete(
  "/shifts/:id",
  validate({ params: shiftIdParamsSchema }),
  deleteShift,
);

shiftScheduleRoutes.get(
  "/schedule",
  validate({ query: listScheduleQuerySchema }),
  listSchedule,
);
shiftScheduleRoutes.get(
  "/schedule/calendar",
  validate({ query: calendarQuerySchema }),
  calendar,
);
shiftScheduleRoutes.get(
  "/schedule/roster",
  validate({ query: rosterQuerySchema }),
  roster,
);
shiftScheduleRoutes.post(
  "/schedule/assign",
  validate({ body: assignBodySchema }),
  assign,
);
shiftScheduleRoutes.post(
  "/schedule/bulk-assign",
  validate({ body: bulkAssignBodySchema }),
  bulkAssign,
);
shiftScheduleRoutes.post(
  "/schedule/auto",
  validate({ body: autoScheduleBodySchema }),
  autoSchedule,
);
shiftScheduleRoutes.post(
  "/schedule/clear",
  validate({ body: clearScheduleBodySchema }),
  clearSchedule,
);
shiftScheduleRoutes.get(
  "/reports",
  validate({ query: reportQuerySchema }),
  report,
);

export default shiftScheduleRoutes;
