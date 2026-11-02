// Attendance API (mounted at /api/v1/staffManagement/attendance).
// Thin layer: reads the request, calls the service, sends the response.
import { getHotelId, route } from "../../../utils/http.js";
import * as service from "../services/attendance.service.js";
import * as deviceService from "../services/attendanceDevice.service.js";

// Who is making a manual change (empty until login exists)
const actorOf = (req) => ({
  userId: req.user?._id || req.user?.id || null,
  name: req.user?.name || req.user?.fullName || "",
});

// GET /attendance?from=&to=&department_id=&designation_id=&status=&q=&sort=&direction=&page=&limit=
export const listAttendance = route(async (req, res) => {
  const { rows, pagination } = await service.listAttendance(getHotelId(req), req.query);
  res.json({ success: true, data: rows, pagination });
});

// GET /attendance/stats  (same filters)  -> cards + status breakdown
export const attendanceStats = route(async (req, res) => {
  res.json({ success: true, data: await service.attendanceStats(getHotelId(req), req.query) });
});

// GET /attendance/trend?days=30
export const attendanceTrend = route(async (req, res) => {
  res.json({ success: true, data: await service.attendanceTrend(getHotelId(req), req.query) });
});

// GET /attendance/activity?limit=5  -> Recent Attendance Activities
export const attendanceActivity = route(async (req, res) => {
  res.json({ success: true, data: await service.recentActivity(getHotelId(req), req.query) });
});

// GET /attendance/export?...same filters as the list  -> CSV
const csvCell = (value) => {
  const text = String(value ?? "");
  // A leading = + - @ would be run as a formula by Excel
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export const exportAttendance = route(async (req, res) => {
  const { batches } = await service.exportAttendance(getHotelId(req), req.query);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="attendance-history.csv"');
  res.write(`﻿${service.EXPORT_COLUMNS.map(([title]) => csvCell(title)).join(",")}\r\n`);

  for await (const rows of batches) {
    for (const row of rows) {
      res.write(`${service.EXPORT_COLUMNS.map(([, read]) => csvCell(read(row))).join(",")}\r\n`);
    }
  }
  res.end();
});

// GET /attendance/:id  -> one record + its correction history
export const getAttendance = route(async (req, res) => {
  res.json({ success: true, data: await service.getAttendance(getHotelId(req), req.params.id) });
});

// POST /attendance/check-in   { staffId, at?, deviceId?, confidence?, source?, remarks? }
export const checkIn = route(async (req, res) => {
  const data = await service.checkIn(getHotelId(req), req.body);
  res.status(201).json({ success: true, message: data.status === "LATE" ? "Checked in (late)." : "Checked in.", data });
});

// POST /attendance/check-out  { staffId, at?, deviceId? }
export const checkOut = route(async (req, res) => {
  const data = await service.checkOut(getHotelId(req), req.body);
  res.json({ success: true, message: "Checked out.", data });
});

// POST /attendance   (manual entry for a day with no record; reason required)
export const createAttendance = route(async (req, res) => {
  const data = await service.createManualRecord(getHotelId(req), req.body, actorOf(req));
  res.status(201).json({ success: true, message: "Attendance added.", data });
});

// PATCH /attendance/:id   (manual correction; reason required, audited)
export const correctAttendance = route(async (req, res) => {
  const data = await service.correctAttendance(getHotelId(req), req.params.id, req.body, actorOf(req));
  res.json({ success: true, message: "Attendance corrected.", data });
});

// POST /attendance/close-day  { date: "2026-10-24" }   (the nightly job, run by hand)
export const closeDay = route(async (req, res) => {
  const data = await service.closeDay(getHotelId(req), req.body?.date);
  res.json({ success: true, message: "Day closed.", data });
});

// ---------------------------------------------------------------------------
// Attendance Devices page   (logic: services/attendanceDevice.service.js)
// ---------------------------------------------------------------------------

// The kiosks send their token in the x-device-token header (or as "Authorization: Bearer ...")
const tokenOf = (req) => {
  const header = req.get ? req.get("authorization") : req.headers?.authorization;
  const bearer = String(header || "").replace(/^Bearer\s+/i, "");
  return (req.get ? req.get("x-device-token") : req.headers?.["x-device-token"]) || bearer;
};

// GET /devices?search=&status=ALL|ONLINE|OFFLINE|WARNING&type=&sort=&direction=&page=&limit=
export const listDevices = route(async (req, res) => {
  const { rows, pagination } = await deviceService.listDevices(getHotelId(req), req.query);
  res.json({ success: true, data: rows, pagination });
});

// GET /devices/summary  -> stats + table page + map pins + activity in one call
export const deviceSummary = route(async (req, res) => {
  const { stats, devices, pagination, map, activity } = await deviceService.deviceSummary(getHotelId(req), req.query);
  res.json({ success: true, data: { stats, devices, map, activity }, pagination });
});

// GET /devices/stats  -> cards + status donut + device types
export const deviceStats = route(async (req, res) => {
  res.json({ success: true, data: await deviceService.deviceStats(getHotelId(req)) });
});

// GET /devices/map  -> pins for the floor plan
export const deviceMap = route(async (req, res) => {
  res.json({ success: true, data: await deviceService.deviceMap(getHotelId(req)) });
});

// GET /devices/activity?limit=5  -> Recent Device Activity
export const deviceActivity = route(async (req, res) => {
  res.json({ success: true, data: await deviceService.deviceActivity(getHotelId(req), req.query) });
});

// GET /devices/:id   (id or device code)
export const getDevice = route(async (req, res) => {
  res.json({ success: true, data: await deviceService.getDevice(getHotelId(req), req.params.id) });
});

// POST /devices   -> the response has `deviceToken` ONCE (put it in the kiosk's settings)
export const createDevice = route(async (req, res) => {
  const data = await deviceService.createDevice(getHotelId(req), req.body);
  res.status(201).json({ success: true, message: "Device added.", data });
});

// PUT /devices/:id   (also { mapX, mapY } to place a pin)
export const updateDevice = route(async (req, res) => {
  const data = await deviceService.updateDevice(getHotelId(req), req.params.id, req.body);
  res.json({ success: true, message: "Device updated.", data });
});

// DELETE /devices/:id
export const deleteDevice = route(async (req, res) => {
  const { message, ...data } = await deviceService.deleteDevice(getHotelId(req), req.params.id);
  res.json({ success: true, message, data });
});

// POST /devices/:id/token   -> a new token, the old one stops working
export const regenerateDeviceToken = route(async (req, res) => {
  const data = await deviceService.regenerateToken(getHotelId(req), req.params.id);
  res.json({ success: true, message: "Token regenerated.", data });
});

// POST /devices/sync-all   (Quick Actions -> Sync All Devices)
export const syncAllDevices = route(async (req, res) => {
  const data = await deviceService.syncAll(getHotelId(req), actorOf(req));
  res.json({ success: true, message: `Sync requested for ${data.queued} device(s).`, data });
});

// POST /devices/:id/commands   { type: TEST_CONNECTION | SYNC_NOW | RESTART }
export const createDeviceCommand = route(async (req, res) => {
  const data = await deviceService.createCommand(getHotelId(req), req.params.id, req.body, actorOf(req));
  res.status(202).json({ success: true, message: "Command sent.", data });
});

// GET /devices/:id/commands/:commandId   (the UI polls this for the kiosk's answer)
export const getDeviceCommand = route(async (req, res) => {
  const data = await deviceService.getCommand(getHotelId(req), req.params.id, req.params.commandId);
  res.json({ success: true, data });
});

// ---- called by the kiosks themselves (device token, not a user login) ----

// POST /devices/heartbeat   every 30-60 s
export const deviceHeartbeat = route(async (req, res) => {
  res.json({ success: true, data: await deviceService.heartbeat(tokenOf(req), req.body) });
});

// POST /devices/commands/:commandId/ack   { ok, message?, latencyMs? }
export const ackDeviceCommand = route(async (req, res) => {
  const data = await deviceService.ackCommand(tokenOf(req), req.params.commandId, req.body);
  res.json({ success: true, data });
});