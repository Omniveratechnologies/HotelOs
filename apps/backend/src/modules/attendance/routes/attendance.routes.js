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

const attendanceRoutes = Router();

// Mounted in staffManagement.routes.js as: staffManagementRoutes.use("/attendance", attendanceRoutes)
// Fixed paths FIRST: "/:id" matches any single word, so "/stats", "/trend" ... must come before it.
attendanceRoutes.get("/stats", attendanceStats);
attendanceRoutes.get("/trend", attendanceTrend);
attendanceRoutes.get("/activity", attendanceActivity);
attendanceRoutes.get("/export", exportAttendance);
attendanceRoutes.post("/check-in", checkIn);
attendanceRoutes.post("/check-out", checkOut);
attendanceRoutes.post("/close-day", closeDay);

// Attendance Devices page. Fixed paths ("stats", "map", "heartbeat" ...) BEFORE "/devices/:id".
attendanceRoutes.get("/devices", listDevices);
attendanceRoutes.get("/devices/summary", deviceSummary);
attendanceRoutes.get("/devices/stats", deviceStats);
attendanceRoutes.get("/devices/map", deviceMap);
attendanceRoutes.get("/devices/activity", deviceActivity);
attendanceRoutes.post("/devices", createDevice);
attendanceRoutes.post("/devices/sync-all", syncAllDevices);
attendanceRoutes.post("/devices/heartbeat", deviceHeartbeat); // called by the kiosks
attendanceRoutes.post("/devices/commands/:commandId/ack", ackDeviceCommand); // called by the kiosks
attendanceRoutes.get("/devices/:id", getDevice);
attendanceRoutes.put("/devices/:id", updateDevice);
attendanceRoutes.delete("/devices/:id", deleteDevice);
attendanceRoutes.post("/devices/:id/token", regenerateDeviceToken);
attendanceRoutes.post("/devices/:id/commands", createDeviceCommand);
attendanceRoutes.get("/devices/:id/commands/:commandId", getDeviceCommand);

attendanceRoutes.get("/", listAttendance);
attendanceRoutes.post("/", createAttendance);

attendanceRoutes.get("/:id", getAttendance);
attendanceRoutes.patch("/:id", correctAttendance);

export default attendanceRoutes;