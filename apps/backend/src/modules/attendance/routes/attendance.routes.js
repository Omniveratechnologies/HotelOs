import { Router } from "express";
import {
  listAttendance,
  attendanceStats,
  attendanceTrend,
  attendanceActivity,
  exportAttendance,
  getAttendance,
  checkIn,
  checkOut,
  createAttendance,
  correctAttendance,
  closeDay,
  listDevices,
  deviceStats,
  deviceSummary,
  deviceMap,
  deviceActivity,
  getDevice,
  createDevice,
  updateDevice,
  deleteDevice,
  regenerateDeviceToken,
  syncAllDevices,
  createDeviceCommand,
  getDeviceCommand,
  deviceHeartbeat,
  ackDeviceCommand,
} from "../controllers/attendance.controller.js";
import { validate } from "#/shared/middleware/validate.middleware.js";
import {
  listAttendanceQuerySchema,
  createAttendanceBodySchema,
  correctAttendanceBodySchema,
  checkInBodySchema,
  checkOutBodySchema,
  closeDayBodySchema,
  attendanceStatsQuerySchema,
  attendanceTrendQuerySchema,
  attendanceActivityQuerySchema,
  exportAttendanceQuerySchema,
  createDeviceBodySchema,
  updateDeviceBodySchema,
  deviceHeartbeatBodySchema,
  syncAllDevicesBodySchema,
  regenerateDeviceTokenBodySchema,
  createDeviceCommandBodySchema,
  ackDeviceCommandBodySchema,
  deviceSummaryQuerySchema,
  deviceStatsQuerySchema,
  deviceMapQuerySchema,
  deviceActivityQuerySchema,
  attendanceIdParamsSchema,
  deviceIdParamsSchema,
  deviceCommandIdParamsSchema,
} from "../schemas.js";

const attendanceRoutes = Router();

// Mounted in staffManagement.routes.js as: staffManagementRoutes.use("/attendance", attendanceRoutes)
// Fixed paths FIRST: "/:id" matches any single word, so "/stats", "/trend" ... must come before it.
attendanceRoutes.get(
  "/stats",
  validate({ query: attendanceStatsQuerySchema }),
  attendanceStats,
);
attendanceRoutes.get(
  "/trend",
  validate({ query: attendanceTrendQuerySchema }),
  attendanceTrend,
);
attendanceRoutes.get(
  "/activity",
  validate({ query: attendanceActivityQuerySchema }),
  attendanceActivity,
);
attendanceRoutes.get(
  "/export",
  validate({ query: exportAttendanceQuerySchema }),
  exportAttendance,
);
attendanceRoutes.post(
  "/check-in",
  validate({ body: checkInBodySchema }),
  checkIn,
);
attendanceRoutes.post(
  "/check-out",
  validate({ body: checkOutBodySchema }),
  checkOut,
);
attendanceRoutes.post(
  "/close-day",
  validate({ body: closeDayBodySchema }),
  closeDay,
);

// Attendance Devices page. Fixed paths ("stats", "map", "heartbeat" ...) BEFORE "/devices/:id".
attendanceRoutes.get("/devices", listDevices);
attendanceRoutes.get(
  "/devices/summary",
  validate({ query: deviceSummaryQuerySchema }),
  deviceSummary,
);
attendanceRoutes.get(
  "/devices/stats",
  validate({ query: deviceStatsQuerySchema }),
  deviceStats,
);
attendanceRoutes.get(
  "/devices/map",
  validate({ query: deviceMapQuerySchema }),
  deviceMap,
);
attendanceRoutes.get(
  "/devices/activity",
  validate({ query: deviceActivityQuerySchema }),
  deviceActivity,
);
attendanceRoutes.post(
  "/devices",
  validate({ body: createDeviceBodySchema }),
  createDevice,
);
attendanceRoutes.post(
  "/devices/sync-all",
  validate({ body: syncAllDevicesBodySchema }),
  syncAllDevices,
);
attendanceRoutes.post(
  "/devices/heartbeat",
  validate({ body: deviceHeartbeatBodySchema }),
  deviceHeartbeat,
); // called by the kiosks
attendanceRoutes.post(
  "/devices/commands/:commandId/ack",
  validate({
    params: deviceCommandIdParamsSchema,
    body: ackDeviceCommandBodySchema,
  }),
  ackDeviceCommand,
); // called by the kiosks
attendanceRoutes.get(
  "/devices/:id",
  validate({ params: deviceIdParamsSchema }),
  getDevice,
);
attendanceRoutes.put(
  "/devices/:id",
  validate({ params: deviceIdParamsSchema, body: updateDeviceBodySchema }),
  updateDevice,
);
attendanceRoutes.delete(
  "/devices/:id",
  validate({ params: deviceIdParamsSchema }),
  deleteDevice,
);
attendanceRoutes.post(
  "/devices/:id/token",
  validate({
    params: deviceIdParamsSchema,
    body: regenerateDeviceTokenBodySchema,
  }),
  regenerateDeviceToken,
);
attendanceRoutes.post(
  "/devices/:id/commands",
  validate({
    params: deviceIdParamsSchema,
    body: createDeviceCommandBodySchema,
  }),
  createDeviceCommand,
);
attendanceRoutes.get(
  "/devices/:id/commands/:commandId",
  validate({ params: deviceCommandIdParamsSchema }),
  getDeviceCommand,
);

attendanceRoutes.get(
  "/",
  validate({ query: listAttendanceQuerySchema }),
  listAttendance,
);
attendanceRoutes.post(
  "/",
  validate({ body: createAttendanceBodySchema }),
  createAttendance,
);

attendanceRoutes.get(
  "/:id",
  validate({ params: attendanceIdParamsSchema }),
  getAttendance,
);
attendanceRoutes.patch(
  "/:id",
  validate({
    params: attendanceIdParamsSchema,
    body: correctAttendanceBodySchema,
  }),
  correctAttendance,
);

export default attendanceRoutes;
