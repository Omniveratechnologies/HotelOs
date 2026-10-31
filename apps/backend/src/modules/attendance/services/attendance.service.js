import mongoose from "mongoose";
import {
  Staff,
  StaffDepartment,
  StaffDesignation,
} from "../../staff-management/models/staffManagement.js";
import { StaffShift } from "../../staff-management/models/staffShift.js";
import {
  AttendanceRecord,
  ATTENDANCE_STATUSES,
} from "../models/attendanceRecord.js";
import { AttendanceAudit } from "../models/attendanceAudit.js";
import { AttendanceRule } from "../models/attendanceRule.js";
import { ApiError, isObjectId } from "../../../utils/http.js";
import * as time from "../../../utils/attendanceTime.js";

const NO_TIME_STATUSES = ["ABSENT", "ON_LEAVE", "HOLIDAY"];
const SORT_KEYS = [
  "date",
  "checkInAt",
  "checkOutAt",
  "workMinutes",
  "status",
  "lastEventAt",
];
const MAX_LIMIT = 100;
const MAX_EXPORT_ROWS = 50000;
const MAX_OPEN_HOURS = 24;

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const toId = (value) => new mongoose.Types.ObjectId(String(value));
const idString = (value) => (value ? String(value) : "");

export const computeStatus = ({ checkInAt, shiftStart, graceMinutes = 10 }) => {
  if (!shiftStart) return "PRESENT";
  return new Date(checkInAt).getTime() >
    new Date(shiftStart).getTime() + graceMinutes * 60000
    ? "LATE"
    : "PRESENT";
};

export const computeWorkMinutes = ({
  checkInAt,
  checkOutAt,
  breakMinutes = 0,
}) => {
  if (!checkInAt || !checkOutAt) return 0;
  const gross = Math.round(
    (new Date(checkOutAt) - new Date(checkInAt)) / 60000,
  );
  return Math.max(0, gross - breakMinutes);
};

export const resolveWorkDate = (at, shift, tz = time.hotelTimezone()) => {
  const day = time.dateKeyOf(at, tz);
  if (shift && time.crossesMidnight(shift.startTime, shift.endTime)) {
    if (time.minutesOfDay(at, tz) < time.toMinutes(shift.endTime))
      return time.addDays(day, -1);
  }
  return day;
};

const parseInstant = (value, field, { nullable = false } = {}) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") {
    if (nullable) return null;
    throw new ApiError(400, `${field} is required.`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime()))
    throw new ApiError(400, `${field} is not a valid date and time.`);
  if (date.getTime() > Date.now() + 5 * 60000)
    throw new ApiError(400, `${field} cannot be in the future.`);
  return date;
};

const readReason = (body) => {
  const reason = String(body.reason ?? "").trim();
  if (reason.length < 3 || reason.length > 300) {
    throw new ApiError(
      400,
      "A reason (3-300 characters) is required for manual changes.",
    );
  }
  return reason;
};

const readStatus = (value) => {
  const status = String(value ?? "")
    .trim()
    .toUpperCase();
  if (!ATTENDANCE_STATUSES.includes(status)) {
    throw new ApiError(
      400,
      `Status must be one of ${ATTENDANCE_STATUSES.join(", ")}.`,
    );
  }
  return status;
};

const readRemarks = (value) => {
  const remarks = String(value ?? "").trim();
  if (remarks.length > 300)
    throw new ApiError(400, "Remarks can be at most 300 characters.");
  return remarks;
};

const readOptionalId = (value, field) => {
  if (value === undefined || value === null || value === "") return null;
  if (!isObjectId(value)) throw new ApiError(400, `${field} is not valid.`);
  return toId(value);
};

const readConfidence = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 1)
    throw new ApiError(400, "confidence must be between 0 and 1.");
  return number;
};

export const readFilters = (query = {}) => {
  const filters = {};

  for (const key of ["from", "to"]) {
    const value = String(query[key] ?? "").trim();
    if (!value) continue;
    if (!time.isDateKey(value))
      throw new ApiError(400, `${key} must be a date like 2026-10-07.`);
    filters[key] = value;
  }
  if (filters.from && filters.to && filters.from > filters.to) {
    throw new ApiError(400, "The start date is after the end date.");
  }

  const idFilters = [
    [
      "departmentId",
      query.department_id ?? query.departmentId,
      "department_id",
    ],
    [
      "designationId",
      query.designation_id ?? query.designationId,
      "designation_id",
    ],
    ["staffId", query.staff_id ?? query.staffId, "staff_id"],
  ];
  for (const [key, value, label] of idFilters) {
    if (value === undefined || value === "" || value === "ALL") continue;
    if (!isObjectId(value)) throw new ApiError(400, `${label} is not valid.`);
    filters[key] = String(value);
  }

  const status = String(query.status ?? "")
    .trim()
    .toUpperCase();
  if (status && status !== "ALL") filters.status = readStatus(status);

  const q = String(query.q ?? query.search ?? "").trim();
  if (q) filters.q = q;

  return filters;
};

export const buildMatch = async (hotelId, filters) => {
  const match = { hotelId };

  if (filters.from || filters.to) {
    match.date = {};
    if (filters.from) match.date.$gte = filters.from;
    if (filters.to) match.date.$lte = filters.to;
  }
  if (filters.departmentId) match.departmentId = toId(filters.departmentId);
  if (filters.designationId) match.designationId = toId(filters.designationId);
  if (filters.status) match.status = filters.status;

  let staffIds = null;
  if (filters.staffId) staffIds = [filters.staffId];

  if (filters.q) {
    const term = new RegExp(escapeRegex(filters.q), "i");
    const found = await Staff.find({
      hotelId,
      $or: [{ name: term }, { staffCode: term }],
    })
      .select("_id")
      .limit(2000)
      .lean();
    const foundIds = found.map((item) => String(item._id));
    staffIds = staffIds
      ? staffIds.filter((id) => foundIds.includes(id))
      : foundIds;
  }

  if (staffIds) match.staffId = { $in: staffIds.map(toId) };

  return match;
};

export const getRules = async (hotelId) => {
  const rule = await AttendanceRule.findOne({ hotelId }).lean();
  return {
    graceMinutes: rule?.graceMinutes ?? 10,
    defaultBreakMinutes: rule?.defaultBreakMinutes ?? 0,
  };
};

const breakFor = (shift, rules) =>
  Math.max(
    0,
    Number(shift?.breakMinutes ?? rules.defaultBreakMinutes ?? 0) || 0,
  );

const hydrate = async (hotelId, records) => {
  const unique = (key) =>
    [
      ...new Set(
        records
          .map((record) => record[key])
          .filter(Boolean)
          .map(String),
      ),
    ].map(toId);

  const [staff, departments, designations, shifts] = await Promise.all([
    Staff.find({ hotelId, _id: { $in: unique("staffId") } })
      .select("name staffCode photoUrl")
      .lean(),
    StaffDepartment.find({ hotelId, _id: { $in: unique("departmentId") } })
      .select("name code color icon")
      .lean(),
    StaffDesignation.find({ hotelId, _id: { $in: unique("designationId") } })
      .select("name code")
      .lean(),
    StaffShift.find({ hotelId, _id: { $in: unique("shiftId") } })
      .select("name startTime endTime")
      .lean(),
  ]);

  const byId = (list) => new Map(list.map((item) => [String(item._id), item]));
  return {
    staff: byId(staff),
    departments: byId(departments),
    designations: byId(designations),
    shifts: byId(shifts),
  };
};

const toRow = (record, lookup) => {
  const staff = lookup.staff.get(idString(record.staffId));
  const department = lookup.departments.get(idString(record.departmentId));
  const designation = lookup.designations.get(idString(record.designationId));
  const shift = lookup.shifts.get(idString(record.shiftId));

  return {
    _id: record._id,
    date: record.date,
    staff: {
      _id: record.staffId,
      name: staff?.name || "Unknown",
      staffCode: staff?.staffCode || "-",
      photoUrl: staff?.photoUrl || "",
    },
    department: department
      ? {
          _id: department._id,
          name: department.name,
          code: department.code || "",
          color: department.color || "#3b82f6",
          icon: department.icon || "building",
        }
      : null,
    designation: designation
      ? { _id: designation._id, name: designation.name }
      : null,
    shift: shift
      ? {
          _id: shift._id,
          name: shift.name,
          startTime: shift.startTime,
          endTime: shift.endTime,
        }
      : null,
    checkInAt: record.checkInAt || null,
    checkOutAt: record.checkOutAt || null,
    workMinutes: record.workMinutes || 0,
    workingHours:
      record.checkInAt && record.checkOutAt
        ? time.formatMinutes(record.workMinutes)
        : "-",
    status: record.status,
    source: record.source,
    confidence: record.confidence ?? null,
    remarks: record.remarks || "",
    checkInDeviceId: record.checkInDeviceId || null,
    checkOutDeviceId: record.checkOutDeviceId || null,
    lastEventAt: record.lastEventAt || null,
  };
};

const toRows = async (hotelId, records) => {
  const lookup = await hydrate(hotelId, records);
  return records.map((record) => toRow(record, lookup));
};

const rowFor = async (hotelId, record) =>
  (await toRows(hotelId, [record.toObject ? record.toObject() : record]))[0];

export const listAttendance = async (hotelId, query = {}) => {
  const filters = readFilters(query);
  const match = await buildMatch(hotelId, filters);

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || 10));

  const sortKey = SORT_KEYS.includes(query.sort) ? query.sort : "date";
  const sign = String(query.direction).toLowerCase() === "asc" ? 1 : -1;
  const sort =
    sortKey === "date"
      ? { date: sign, checkInAt: sign, _id: sign }
      : { [sortKey]: sign, date: -1, _id: -1 };

  const [records, total] = await Promise.all([
    AttendanceRecord.find(match)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AttendanceRecord.countDocuments(match),
  ]);

  return {
    rows: await toRows(hotelId, records),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

const percentOf = (part, total) =>
  total > 0 ? Math.round((part / total) * 100) : 0;

export const attendanceStats = async (hotelId, query = {}) => {
  const match = await buildMatch(hotelId, readFilters(query));

  const groups = await AttendanceRecord.aggregate([
    { $match: match },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const count = (status) =>
    groups.find((group) => group._id === status)?.count || 0;

  const counts = {
    present: count("PRESENT"),
    late: count("LATE"),
    absent: count("ABSENT"),
    onLeave: count("ON_LEAVE"),
    holiday: count("HOLIDAY"),
  };
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

  return {
    total,
    ...counts,
    percent: Object.fromEntries(
      Object.entries(counts).map(([key, value]) => [
        key,
        percentOf(value, total),
      ]),
    ),
  };
};

export const attendanceTrend = async (
  hotelId,
  query = {},
  now = new Date(),
) => {
  const days = Math.min(366, Math.max(1, Number(query.days) || 30));
  const to = time.todayKey(time.hotelTimezone(), now);
  const from = time.addDays(to, -(days - 1));

  const filters = readFilters({
    department_id: query.department_id,
    designation_id: query.designation_id,
  });
  const match = await buildMatch(hotelId, { ...filters, from, to });

  const groups = await AttendanceRecord.aggregate([
    { $match: match },
    {
      $group: { _id: { date: "$date", status: "$status" }, count: { $sum: 1 } },
    },
  ]);

  const points = new Map(
    time
      .eachDate(from, to)
      .map((date) => [
        date,
        { date, present: 0, late: 0, absent: 0, onLeave: 0, holiday: 0 },
      ]),
  );
  const field = {
    PRESENT: "present",
    LATE: "late",
    ABSENT: "absent",
    ON_LEAVE: "onLeave",
    HOLIDAY: "holiday",
  };

  for (const group of groups) {
    const point = points.get(group._id.date);
    if (point && field[group._id.status])
      point[field[group._id.status]] = group.count;
  }

  return { from, to, days, points: [...points.values()] };
};

const activityAction = (record) => {
  if (record.checkOutAt) return "CHECKED_OUT";
  if (record.checkInAt)
    return record.status === "LATE" ? "CHECKED_IN_LATE" : "CHECKED_IN";
  if (record.status === "ABSENT") return "MARKED_ABSENT";
  if (record.status === "ON_LEAVE") return "ON_LEAVE";
  return "HOLIDAY";
};

export const recentActivity = async (hotelId, query = {}) => {
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 5));
  const filters = readFilters({ department_id: query.department_id });
  const match = {
    ...(await buildMatch(hotelId, filters)),
    lastEventAt: { $ne: null },
  };

  const records = await AttendanceRecord.find(match)
    .sort({ lastEventAt: -1, _id: -1 })
    .limit(limit)
    .lean();
  const lookup = await hydrate(hotelId, records);

  return records.map((record) => {
    const row = toRow(record, lookup);
    return {
      _id: record._id,
      action: activityAction(record),
      at: record.lastEventAt,
      date: record.date,
      status: record.status,
      staff: row.staff,
      department: row.department,
      designation: row.designation,
    };
  });
};

const findRecord = async (hotelId, id) => {
  if (!isObjectId(id)) throw new ApiError(400, "Invalid attendance ID.");
  const record = await AttendanceRecord.findOne({ _id: id, hotelId });
  if (!record) throw new ApiError(404, "Attendance record not found.");
  return record;
};

export const getAttendance = async (hotelId, id) => {
  const record = await findRecord(hotelId, id);
  const history = await AttendanceAudit.find({
    hotelId,
    attendanceId: record._id,
  })
    .sort({ createdAt: -1 })
    .lean();

  return { ...(await rowFor(hotelId, record)), history };
};

const loadStaff = async (hotelId, staffId) => {
  if (!isObjectId(staffId))
    throw new ApiError(400, "Select a valid staff member.");
  const staff = await Staff.findOne({
    _id: staffId,
    hotelId,
    deletedAt: null,
  }).lean();
  if (!staff) throw new ApiError(404, "Staff not found.");
  return staff;
};

const loadShift = async (hotelId, shiftId) =>
  shiftId ? StaffShift.findOne({ _id: shiftId, hotelId }).lean() : null;

const duplicateRecord = (error) =>
  error?.code === 11000
    ? new ApiError(
        409,
        "An attendance record already exists for this staff member on that day.",
      )
    : error;

export const checkIn = async (hotelId, body = {}) => {
  const staff = await loadStaff(hotelId, body.staffId);
  if (staff.status === "INACTIVE")
    throw new ApiError(409, `${staff.name} is inactive and cannot check in.`);

  const at = parseInstant(body.at, "at") || new Date();
  const [shift, rules] = await Promise.all([
    loadShift(hotelId, staff.shiftId),
    getRules(hotelId),
  ]);

  const tz = time.hotelTimezone();
  const date = resolveWorkDate(at, shift, tz);
  const shiftStart = shift ? time.shiftWindow(date, shift, tz).start : null;
  const status = computeStatus({
    checkInAt: at,
    shiftStart,
    graceMinutes: rules.graceMinutes,
  });

  const values = {
    departmentId: staff.departmentId || null,
    designationId: staff.designationId || null,
    shiftId: staff.shiftId || null,
    checkInAt: at,
    checkOutAt: null,
    workMinutes: 0,
    status,
    checkInDeviceId: readOptionalId(body.deviceId, "deviceId"),
    confidence: readConfidence(body.confidence),
    source: body.source === "manual" ? "manual" : "face",
    remarks: readRemarks(body.remarks),
    lastEventAt: at,
  };

  const existing = await AttendanceRecord.findOne({ staffId: staff._id, date });

  if (existing) {
    if (existing.checkInAt)
      throw new ApiError(
        409,
        `${staff.name} has already checked in for ${date}.`,
      );
    if (existing.status !== "ABSENT") {
      throw new ApiError(
        409,
        `${staff.name} is marked ${existing.status.replace("_", " ")} for ${date}. Use a manual correction instead.`,
      );
    }

    Object.assign(existing, values);
    await existing.save();
    return rowFor(hotelId, existing);
  }

  try {
    const created = await AttendanceRecord.create({
      hotelId,
      staffId: staff._id,
      date,
      ...values,
    });
    return rowFor(hotelId, created);
  } catch (error) {
    throw duplicateRecord(error);
  }
};

export const checkOut = async (hotelId, body = {}) => {
  const staff = await loadStaff(hotelId, body.staffId);
  const at = parseInstant(body.at, "at") || new Date();

  const open = await AttendanceRecord.findOne({
    hotelId,
    staffId: staff._id,
    checkInAt: { $ne: null },
    checkOutAt: null,
  }).sort({ checkInAt: -1 });

  if (!open)
    throw new ApiError(
      409,
      `${staff.name} has no open check-in to check out from.`,
    );
  if (at.getTime() <= new Date(open.checkInAt).getTime())
    throw new ApiError(400, "Check-out must be after the check-in.");
  if (
    at.getTime() - new Date(open.checkInAt).getTime() >
    MAX_OPEN_HOURS * 3600000
  ) {
    throw new ApiError(
      409,
      `The last check-in is more than ${MAX_OPEN_HOURS} hours old. Correct that record manually.`,
    );
  }

  const [shift, rules] = await Promise.all([
    loadShift(hotelId, open.shiftId),
    getRules(hotelId),
  ]);

  open.checkOutAt = at;
  open.workMinutes = computeWorkMinutes({
    checkInAt: open.checkInAt,
    checkOutAt: at,
    breakMinutes: breakFor(shift, rules),
  });
  open.checkOutDeviceId = readOptionalId(body.deviceId, "deviceId");
  open.lastEventAt = at;
  await open.save();

  return rowFor(hotelId, open);
};

const iso = (value) => (value ? new Date(value).toISOString() : null);

const audit = (hotelId, record, action, changes, reason, actor = {}) =>
  AttendanceAudit.create({
    hotelId,
    attendanceId: record._id,
    staffId: record.staffId,
    action,
    changes,
    reason,
    changedBy:
      actor.userId && isObjectId(actor.userId) ? toId(actor.userId) : null,
    changedByName: actor.name || "",
  });

const settle = (
  { status, checkInAt, checkOutAt },
  { statusGiven, timesGiven },
  statusFromShift,
) => {
  if (NO_TIME_STATUSES.includes(status)) {
    if (timesGiven && (checkInAt || checkOutAt)) {
      throw new ApiError(
        400,
        "Absent, On Leave and Holiday records cannot have check-in / check-out times.",
      );
    }
    return { status, checkInAt: null, checkOutAt: null };
  }

  if (!checkInAt)
    throw new ApiError(
      400,
      "A check-in time is required for a Present or Late record.",
    );
  if (checkOutAt && new Date(checkOutAt) <= new Date(checkInAt))
    throw new ApiError(400, "Check-out must be after the check-in.");

  return {
    status: !statusGiven && timesGiven ? statusFromShift() : status,
    checkInAt,
    checkOutAt,
  };
};

export const createManualRecord = async (hotelId, body = {}, actor = {}) => {
  const reason = readReason(body);
  const staff = await loadStaff(hotelId, body.staffId);

  const date = String(body.date ?? "").trim();
  if (!time.isDateKey(date))
    throw new ApiError(400, "date must be like 2026-10-07.");
  if (date > time.todayKey())
    throw new ApiError(400, "date cannot be in the future.");

  const checkInAt =
    parseInstant(body.checkInAt, "checkInAt", { nullable: true }) ?? null;
  const checkOutAt =
    parseInstant(body.checkOutAt, "checkOutAt", { nullable: true }) ?? null;
  const statusGiven = body.status !== undefined && body.status !== "";

  const [shift, rules] = await Promise.all([
    loadShift(hotelId, staff.shiftId),
    getRules(hotelId),
  ]);
  const tz = time.hotelTimezone();

  const statusFromShift = () =>
    computeStatus({
      checkInAt,
      shiftStart: shift ? time.shiftWindow(date, shift, tz).start : null,
      graceMinutes: rules.graceMinutes,
    });

  const status = statusGiven
    ? readStatus(body.status)
    : checkInAt
      ? statusFromShift()
      : null;
  if (!status) throw new ApiError(400, "Give a status, or a check-in time.");

  const settled = settle(
    { status, checkInAt, checkOutAt },
    { statusGiven, timesGiven: true },
    statusFromShift,
  );

  const values = {
    hotelId,
    staffId: staff._id,
    date,
    departmentId: staff.departmentId || null,
    designationId: staff.designationId || null,
    shiftId: staff.shiftId || null,
    ...settled,
    workMinutes: computeWorkMinutes({
      ...settled,
      breakMinutes: breakFor(shift, rules),
    }),
    source: "manual",
    remarks: readRemarks(body.remarks),
    lastEventAt: settled.checkOutAt || settled.checkInAt || new Date(),
  };

  let record;
  try {
    record = await AttendanceRecord.create(values);
  } catch (error) {
    throw duplicateRecord(error);
  }

  await audit(
    hotelId,
    record,
    "CREATE",
    [
      { field: "status", from: null, to: settled.status },
      { field: "checkInAt", from: null, to: iso(settled.checkInAt) },
      { field: "checkOutAt", from: null, to: iso(settled.checkOutAt) },
    ],
    reason,
    actor,
  );

  return rowFor(hotelId, record);
};

export const correctAttendance = async (hotelId, id, body = {}, actor = {}) => {
  const record = await findRecord(hotelId, id);
  const reason = readReason(body);
  const has = (key) => body[key] !== undefined;

  const next = {
    status: record.status,
    checkInAt: record.checkInAt || null,
    checkOutAt: record.checkOutAt || null,
    remarks: record.remarks || "",
  };

  if (has("status")) next.status = readStatus(body.status);
  if (has("checkInAt"))
    next.checkInAt = parseInstant(body.checkInAt, "checkInAt", {
      nullable: true,
    });
  if (has("checkOutAt"))
    next.checkOutAt = parseInstant(body.checkOutAt, "checkOutAt", {
      nullable: true,
    });
  if (has("remarks")) next.remarks = readRemarks(body.remarks);

  if (
    !has("status") &&
    NO_TIME_STATUSES.includes(next.status) &&
    next.checkInAt
  )
    next.status = "PRESENT";

  const [shift, rules] = await Promise.all([
    loadShift(hotelId, record.shiftId),
    getRules(hotelId),
  ]);
  const tz = time.hotelTimezone();

  const statusFromShift = () =>
    computeStatus({
      checkInAt: next.checkInAt,
      shiftStart: shift ? time.shiftWindow(record.date, shift, tz).start : null,
      graceMinutes: rules.graceMinutes,
    });

  const settled = settle(
    next,
    {
      statusGiven: has("status"),
      timesGiven: has("checkInAt") || has("checkOutAt"),
    },
    statusFromShift,
  );

  const after = {
    ...settled,
    remarks: next.remarks,
    workMinutes: computeWorkMinutes({
      ...settled,
      breakMinutes: breakFor(shift, rules),
    }),
  };

  const compare = [
    ["status", record.status, after.status],
    ["checkInAt", iso(record.checkInAt), iso(after.checkInAt)],
    ["checkOutAt", iso(record.checkOutAt), iso(after.checkOutAt)],
    ["remarks", record.remarks || "", after.remarks],
  ];
  const changes = compare
    .filter(([, from, to]) => from !== to)
    .map(([field, from, to]) => ({ field, from, to }));

  if (changes.length === 0) throw new ApiError(400, "Nothing to change.");

  Object.assign(record, after, {
    source: "manual",
    lastEventAt:
      record.lastEventAt || after.checkOutAt || after.checkInAt || new Date(),
  });
  await record.save();
  await audit(hotelId, record, "CORRECTION", changes, reason, actor);

  return rowFor(hotelId, record);
};

const leaveStaffIds = async (hotelId, date) => {
  const Leave = mongoose.models.StaffLeave;
  if (!Leave) return new Set();
  const rows = await Leave.find({
    hotelId,
    status: "APPROVED",
    fromDate: { $lte: date },
    toDate: { $gte: date },
  })
    .select("staffId")
    .lean();
  return new Set(rows.map((row) => String(row.staffId)));
};

const isHoliday = async (hotelId, date) => {
  const Holiday = mongoose.models.StaffHoliday;
  if (!Holiday) return false;
  return Boolean(await Holiday.exists({ hotelId, date }));
};

export const closeDay = async (hotelId, date, now = new Date()) => {
  if (!time.isDateKey(date))
    throw new ApiError(400, "date must be like 2026-10-07.");
  if (date >= time.todayKey(time.hotelTimezone(), now)) {
    throw new ApiError(
      400,
      "Only a finished day can be closed. Use yesterday or earlier.",
    );
  }

  const endOfDay = new Date(
    time.wallTimeToInstant(time.addDays(date, 1), "00:00").getTime() - 1,
  );

  const [staff, existing, onLeave, holiday] = await Promise.all([
    Staff.find({
      hotelId,
      deletedAt: null,
      status: "ACTIVE",
      joinedOn: { $lte: endOfDay },
    })
      .select("departmentId designationId shiftId")
      .lean(),
    AttendanceRecord.find({ hotelId, date }).select("staffId").lean(),
    leaveStaffIds(hotelId, date),
    isHoliday(hotelId, date),
  ]);

  const done = new Set(existing.map((record) => String(record.staffId)));
  const stamp = endOfDay;
  const result = {
    date,
    created: 0,
    absent: 0,
    onLeave: 0,
    holiday: 0,
    alreadyRecorded: done.size,
  };

  const docs = [];
  for (const member of staff) {
    if (done.has(String(member._id))) continue;

    const status = onLeave.has(String(member._id))
      ? "ON_LEAVE"
      : holiday
        ? "HOLIDAY"
        : "ABSENT";
    docs.push({
      hotelId,
      staffId: member._id,
      date,
      departmentId: member.departmentId || null,
      designationId: member.designationId || null,
      shiftId: member.shiftId || null,
      status,
      source: "system",
      lastEventAt: stamp,
    });
    result[
      { ABSENT: "absent", ON_LEAVE: "onLeave", HOLIDAY: "holiday" }[status]
    ] += 1;
  }

  if (docs.length > 0) {
    try {
      await AttendanceRecord.insertMany(docs, { ordered: false });
      result.created = docs.length;
    } catch (error) {
      if (error?.code !== 11000 && !error?.writeErrors) throw error;
      result.created =
        error.insertedDocs?.length ??
        docs.length - (error.writeErrors?.length || 0);
    }
  }

  result.openCheckIns = await AttendanceRecord.countDocuments({
    hotelId,
    date,
    checkInAt: { $ne: null },
    checkOutAt: null,
  });

  return result;
};

export const EXPORT_COLUMNS = [
  ["Date", (row) => row.date],
  ["Staff ID", (row) => row.staff.staffCode],
  ["Name", (row) => row.staff.name],
  ["Department", (row) => row.department?.name || ""],
  ["Designation", (row) => row.designation?.name || ""],
  ["Shift", (row) => row.shift?.name || ""],
  [
    "Check In",
    (row) => (row.checkInAt ? new Date(row.checkInAt).toISOString() : ""),
  ],
  [
    "Check Out",
    (row) => (row.checkOutAt ? new Date(row.checkOutAt).toISOString() : ""),
  ],
  [
    "Working Hours",
    (row) => (row.workingHours === "-" ? "" : row.workingHours),
  ],
  ["Status", (row) => row.status],
  ["Source", (row) => row.source],
  ["Remarks", (row) => row.remarks],
];

export const exportAttendance = async (hotelId, query = {}) => {
  const match = await buildMatch(hotelId, readFilters(query));
  const total = await AttendanceRecord.countDocuments(match);

  if (total > MAX_EXPORT_ROWS) {
    throw new ApiError(
      413,
      `${total} records match. Narrow the date range to ${MAX_EXPORT_ROWS} records or fewer.`,
    );
  }

  const BATCH = 500;
  const batches = async function* () {
    for (let skip = 0; skip < total; skip += BATCH) {
      const records = await AttendanceRecord.find(match)
        .sort({ date: -1, _id: -1 })
        .skip(skip)
        .limit(BATCH)
        .lean();
      yield await toRows(hotelId, records);
    }
  };

  return { total, batches: batches() };
};
