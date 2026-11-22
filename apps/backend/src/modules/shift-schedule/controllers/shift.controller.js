import { getHotelId, route } from "../../../utils/http.js";
import * as shifts from "../services/shift.service.js";
import * as schedule from "../services/schedule.service.js";

const actorOf = (req) => ({ name: req.user?.name || req.user?.fullName || "" });

// GET /summary?date=&todayLimit=
export const summary = route(async (req, res) => {
  res.json({
    success: true,
    data: await schedule.summary(getHotelId(req), req.query),
  });
});

// GET /shifts?status=ALL|ACTIVE|INACTIVE&q=
export const listShifts = route(async (req, res) => {
  res.json({
    success: true,
    data: await schedule.listShifts(getHotelId(req), req.query),
  });
});

// GET /shifts/:id
export const getShift = route(async (req, res) => {
  res.json({
    success: true,
    data: await shifts.getShift(getHotelId(req), req.params.id),
  });
});

// POST /shifts { name, startTime, endTime, segments?, breakMinutes?, graceMinutes?, color? }
export const createShift = route(async (req, res) => {
  const data = await shifts.createShift(getHotelId(req), req.body);
  res.status(201).json({ success: true, message: "Shift created.", data });
});

// PUT /shifts/:id
export const updateShift = route(async (req, res) => {
  const data = await shifts.updateShift(
    getHotelId(req),
    req.params.id,
    req.body,
  );
  res.json({ success: true, message: "Shift updated.", data });
});

// DELETE /shifts/:id
export const deleteShift = route(async (req, res) => {
  const data = await shifts.deleteShift(getHotelId(req), req.params.id);
  res.json({ success: true, message: "Shift deleted.", data });
});

// GET /schedule?date=&department_id=&shift_id=&status=ALL|ON_DUTY|SCHEDULED|COMPLETED|MISSED|ABSENT&q=&page=&limit=
export const listSchedule = route(async (req, res) => {
  const { rows, pagination, counts, date } = await schedule.listSchedule(
    getHotelId(req),
    req.query,
  );
  res.json({ success: true, data: rows, pagination, counts, date });
});

// GET /schedule/calendar?month=2026-10&department_id=
export const calendar = route(async (req, res) => {
  res.json({
    success: true,
    data: await schedule.calendar(getHotelId(req), req.query),
  });
});

// GET /schedule/roster?from=&to=&department_id=&q=&page=&limit=
export const roster = route(async (req, res) => {
  const { rows, pagination, ...rest } = await schedule.roster(
    getHotelId(req),
    req.query,
  );
  res.json({ success: true, data: rows, pagination, ...rest });
});

// POST /schedule/assign { staffId, shiftId|null, fromDate, toDate?, overwrite? }
export const assign = route(async (req, res) => {
  const data = await schedule.bulkAssign(
    getHotelId(req),
    { overwrite: true, ...req.body },
    actorOf(req),
  );
  res.json({ success: true, message: "Schedule updated.", data });
});

// POST /schedule/bulk-assign { staffIds[]|departmentId, shiftId|null, fromDate, toDate, daysOfWeek?, overwrite?, strictRest?, dryRun? }
export const bulkAssign = route(async (req, res) => {
  const data = await schedule.bulkAssign(
    getHotelId(req),
    req.body,
    actorOf(req),
  );
  res.json({
    success: true,
    message: data.dryRun ? "Preview ready." : "Schedule updated.",
    data,
  });
});

// POST /schedule/auto { fromDate, toDate, departmentId?, staffIds?, shiftIds?, weeklyOffDays?, rotateWeeklyOff?, minRestHours?, coverage?, overwrite?, dryRun? }
export const autoSchedule = route(async (req, res) => {
  const data = await schedule.autoSchedule(
    getHotelId(req),
    req.body,
    actorOf(req),
  );
  res.json({
    success: true,
    message: data.dryRun ? "Preview ready." : "Auto schedule applied.",
    data,
  });
});

// POST /schedule/clear { staffIds[]|departmentId, fromDate, toDate }
export const clearSchedule = route(async (req, res) => {
  const data = await schedule.clearAssignments(getHotelId(req), req.body);
  res.json({ success: true, message: "Booked days cleared.", data });
});

// GET /reports?from=&to=&department_id=
export const report = route(async (req, res) => {
  res.json({
    success: true,
    data: await schedule.report(getHotelId(req), req.query),
  });
});
