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

const shiftScheduleRoutes = Router();

shiftScheduleRoutes.get("/summary", summary);
shiftScheduleRoutes.get("/reports", report);

shiftScheduleRoutes.get("/shifts", listShifts);
shiftScheduleRoutes.post("/shifts", createShift);
shiftScheduleRoutes.get("/shifts/:id", getShift);
shiftScheduleRoutes.put("/shifts/:id", updateShift);
shiftScheduleRoutes.delete("/shifts/:id", deleteShift);

shiftScheduleRoutes.get("/schedule", listSchedule);
shiftScheduleRoutes.get("/schedule/calendar", calendar);
shiftScheduleRoutes.get("/schedule/roster", roster);
shiftScheduleRoutes.post("/schedule/assign", assign);
shiftScheduleRoutes.post("/schedule/bulk-assign", bulkAssign);
shiftScheduleRoutes.post("/schedule/auto", autoSchedule);
shiftScheduleRoutes.post("/schedule/clear", clearSchedule);

export default shiftScheduleRoutes;
