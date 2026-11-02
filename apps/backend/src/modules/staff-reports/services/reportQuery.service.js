import mongoose from "mongoose";
import {
  AttendanceRecord,
  ATTENDANCE_STATUSES,
} from "../../attendance/models/attendanceRecord.js";
import {
  AttendanceDevice,
  DEVICE_STATUSES,
} from "../../attendance/models/attendanceDevice.js";
import { LeaveRequest, LEAVE_STATUSES } from "../../leaveManagement/models/leaveRequest.js";
import { ShiftAssignment } from "../../shift-schedule/models/staffAssignment.js";
import { Staff } from "../../staff-management/models/staffManagement.js";

const TZ = "Asia/Kolkata";
const MAX_ROWS = 50000;
const MAX_RANGE_DAYS = 366;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const fail = (status, message) =>
  Object.assign(new Error(message), { status, statusCode: status });

const pick = (v) => {
  const s = String(v ?? "").trim();
  return !s || s.toUpperCase() === "ALL" ? "" : s;
};

const idOf = (v, label) => {
  const s = pick(v);
  if (!s) return null;
  if (!mongoose.isValidObjectId(s)) throw fail(400, `Invalid ${label}.`);
  return s;
};

const statusOf = (v, allowed) => {
  const s = pick(v).toUpperCase().replace(/\s+/g, "_");
  if (!s) return "";
  if (!allowed.includes(s))
    throw fail(400, `Invalid status. Allowed: ${allowed.join(", ")}`);
  return s;
};

const rangeOf = (f) => {
  const from = pick(f.from);
  const to = pick(f.to);
  if (!DATE_RE.test(from) || !DATE_RE.test(to))
    throw fail(400, "Select a valid from and to date (YYYY-MM-DD).");
  if (from > to) throw fail(400, "From date cannot be after to date.");
  const days = (Date.parse(to) - Date.parse(from)) / 86400000 + 1;
  if (days > MAX_RANGE_DAYS)
    throw fail(400, `Date range cannot exceed ${MAX_RANGE_DAYS} days.`);
  return { from, to };
};

const label = (s) =>
  String(s ?? "")
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-CA", { timeZone: TZ }) : "";

const fmtTime = (d) =>
  d
    ? new Date(d).toLocaleTimeString("en-IN", {
        timeZone: TZ,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "";

const fmtDateTime = (d) => (d ? `${fmtDate(d)} ${fmtTime(d)}` : "");

const fmtHours = (m) =>
  m > 0 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m` : "";

const staffIdsFor = async (hotelId, departmentId, designationId) => {
  if (!departmentId && !designationId) return null;
  const q = { hotelId, deletedAt: null };
  if (departmentId) q.departmentId = departmentId;
  if (designationId) q.designationId = designationId;
  return Staff.distinct("_id", q);
};

const DEFS = {
  ATTENDANCE: {
    title: "Attendance Report",
    model: AttendanceRecord,
    sort: { date: -1, checkInAt: 1 },
    populate: [
      { path: "staffId", select: "name staffCode" },
      { path: "departmentId", select: "name" },
      { path: "designationId", select: "name" },
      { path: "shiftId", select: "name" },
    ],
    columns: [
      { key: "date", title: "Date" },
      { key: "staffCode", title: "Staff ID" },
      { key: "staff", title: "Staff" },
      { key: "department", title: "Department" },
      { key: "designation", title: "Designation" },
      { key: "shift", title: "Shift" },
      { key: "checkIn", title: "Check-in" },
      { key: "checkOut", title: "Check-out" },
      { key: "hours", title: "Hours" },
      { key: "status", title: "Status" },
      { key: "device", title: "Device" },
    ],
    async filter(hotelId, f) {
      const { from, to } = rangeOf(f);
      const q = { hotelId, date: { $gte: from, $lte: to } };
      const departmentId = idOf(f.departmentId, "department");
      const designationId = idOf(f.designationId, "designation");
      const deviceId = idOf(f.deviceId, "device");
      const status = statusOf(f.status, ATTENDANCE_STATUSES);
      if (departmentId) q.departmentId = departmentId;
      if (designationId) q.designationId = designationId;
      if (status) q.status = status;
      if (deviceId)
        q.$or = [{ checkInDeviceId: deviceId }, { checkOutDeviceId: deviceId }];
      return q;
    },
    async context(docs) {
      const ids = [
        ...new Set(
          docs
            .map((d) => d.checkInDeviceId)
            .filter(Boolean)
            .map(String),
        ),
      ];
      const devices = ids.length
        ? await AttendanceDevice.find({ _id: { $in: ids } })
            .select("name")
            .lean()
        : [];
      return { devices: new Map(devices.map((x) => [String(x._id), x.name])) };
    },
    row: (d, ctx) => ({
      date: d.date,
      staffCode: d.staffId?.staffCode ?? "",
      staff: d.staffId?.name ?? "",
      department: d.departmentId?.name ?? "",
      designation: d.designationId?.name ?? "",
      shift: d.shiftId?.name ?? "",
      checkIn: fmtTime(d.checkInAt),
      checkOut: fmtTime(d.checkOutAt),
      hours: fmtHours(d.workMinutes),
      status: label(d.status),
      device: ctx.devices.get(String(d.checkInDeviceId)) ?? "",
    }),
  },

  STAFF: {
    title: "Staff Report",
    model: Staff,
    sort: { name: 1 },
    populate: [
      { path: "departmentId", select: "name" },
      { path: "designationId", select: "name" },
      { path: "shiftId", select: "name" },
    ],
    columns: [
      { key: "staffCode", title: "Staff ID" },
      { key: "name", title: "Name" },
      { key: "phone", title: "Phone" },
      { key: "email", title: "Email" },
      { key: "department", title: "Department" },
      { key: "designation", title: "Designation" },
      { key: "shift", title: "Shift" },
      { key: "employmentType", title: "Employment Type" },
      { key: "status", title: "Status" },
      { key: "joinedOn", title: "Joined On" },
    ],
    async filter(hotelId, f) {
      const q = { hotelId, deletedAt: null };
      const departmentId = idOf(f.departmentId, "department");
      const designationId = idOf(f.designationId, "designation");
      const status = statusOf(f.status, ["ACTIVE", "INACTIVE"]);
      if (departmentId) q.departmentId = departmentId;
      if (designationId) q.designationId = designationId;
      if (status) q.status = status;
      return q;
    },
    row: (d) => ({
      staffCode: d.staffCode,
      name: d.name,
      phone: d.phone,
      email: d.email ?? "",
      department: d.departmentId?.name ?? "",
      designation: d.designationId?.name ?? "",
      shift: d.shiftId?.name ?? "",
      employmentType: label(d.employmentType),
      status: label(d.status),
      joinedOn: fmtDate(d.joinedOn),
    }),
  },

  LEAVE: {
    title: "Leave Report",
    model: LeaveRequest,
    sort: { fromDate: -1 },
    populate: [
      { path: "staffId", select: "name staffCode" },
      { path: "leaveTypeId", select: "name" },
      { path: "departmentId", select: "name" },
      { path: "designationId", select: "name" },
    ],
    columns: [
      { key: "staffCode", title: "Staff ID" },
      { key: "staff", title: "Staff" },
      { key: "department", title: "Department" },
      { key: "leaveType", title: "Leave Type" },
      { key: "fromDate", title: "From" },
      { key: "toDate", title: "To" },
      { key: "days", title: "Days" },
      { key: "status", title: "Status" },
      { key: "appliedOn", title: "Applied On" },
      { key: "approver", title: "Approver" },
      { key: "reason", title: "Reason" },
    ],
    async filter(hotelId, f) {
      const { from, to } = rangeOf(f);
      const q = { hotelId, fromDate: { $lte: to }, toDate: { $gte: from } };
      const departmentId = idOf(f.departmentId, "department");
      const designationId = idOf(f.designationId, "designation");
      const status = statusOf(f.status, LEAVE_STATUSES);
      if (departmentId) q.departmentId = departmentId;
      if (designationId) q.designationId = designationId;
      if (status) q.status = status;
      return q;
    },
    row: (d) => ({
      staffCode: d.staffId?.staffCode ?? "",
      staff: d.staffId?.name ?? "",
      department: d.departmentId?.name ?? "",
      leaveType: d.leaveTypeId?.name ?? "",
      fromDate: d.fromDate,
      toDate: d.toDate,
      days: d.days,
      status: label(d.status),
      appliedOn: fmtDate(d.appliedAt),
      approver: d.approverName ?? "",
      reason: d.reason ?? "",
    }),
  },

  SHIFT: {
    title: "Shift Report",
    model: ShiftAssignment,
    sort: { date: -1 },
    populate: [
      {
        path: "staffId",
        select: "name staffCode departmentId",
        populate: { path: "departmentId", select: "name" },
      },
      { path: "shiftId", select: "name startTime endTime" },
    ],
    columns: [
      { key: "date", title: "Date" },
      { key: "staffCode", title: "Staff ID" },
      { key: "staff", title: "Staff" },
      { key: "department", title: "Department" },
      { key: "shift", title: "Shift" },
      { key: "startTime", title: "Start" },
      { key: "endTime", title: "End" },
      { key: "source", title: "Assigned Via" },
    ],
    async filter(hotelId, f) {
      const { from, to } = rangeOf(f);
      const q = { hotelId, date: { $gte: from, $lte: to } };
      const departmentId = idOf(f.departmentId, "department");
      const designationId = idOf(f.designationId, "designation");
      const shiftId = idOf(f.shiftId, "shift");
      const staffIds = await staffIdsFor(hotelId, departmentId, designationId);
      if (staffIds) q.staffId = { $in: staffIds };
      if (shiftId) q.shiftId = shiftId;
      return q;
    },
    row: (d) => ({
      date: d.date,
      staffCode: d.staffId?.staffCode ?? "",
      staff: d.staffId?.name ?? "",
      department: d.staffId?.departmentId?.name ?? "",
      shift: d.shiftId?.name ?? "Day Off",
      startTime: d.shiftId?.startTime ?? "",
      endTime: d.shiftId?.endTime ?? "",
      source: label(d.source),
    }),
  },

  DEVICE: {
    title: "Device Report",
    model: AttendanceDevice,
    sort: { name: 1 },
    populate: [],
    columns: [
      { key: "deviceCode", title: "Code" },
      { key: "name", title: "Name" },
      { key: "type", title: "Type" },
      { key: "location", title: "Location" },
      { key: "status", title: "Status" },
      { key: "ipAddress", title: "IP Address" },
      { key: "firmwareVersion", title: "Firmware" },
      { key: "lastSeenAt", title: "Last Seen" },
      { key: "lastSyncAt", title: "Last Sync" },
    ],
    async filter(hotelId, f) {
      const q = { hotelId, deletedAt: null };
      const deviceId = idOf(f.deviceId, "device");
      const status = statusOf(f.status, DEVICE_STATUSES);
      if (deviceId) q._id = deviceId;
      if (status) q.status = status;
      return q;
    },
    row: (d) => ({
      deviceCode: d.deviceCode,
      name: d.name,
      type: label(d.type),
      location: d.location,
      status: label(d.status),
      ipAddress: d.ipAddress ?? "",
      firmwareVersion: d.firmwareVersion ?? "",
      lastSeenAt: fmtDateTime(d.lastSeenAt),
      lastSyncAt: fmtDateTime(d.lastSyncAt),
    }),
  },
};

export const normalizeType = (type) => {
  const t = String(type ?? "")
    .trim()
    .toUpperCase();
  if (!DEFS[t])
    throw fail(
      400,
      `Invalid report type. Allowed: ${Object.keys(DEFS).join(", ")}`,
    );
  return t;
};

export const reportTitle = (type) => DEFS[type].title;

export async function countReport(hotelId, type, filters = {}) {
  const def = DEFS[type];
  const query = await def.filter(hotelId, filters ?? {});
  const total = await def.model.countDocuments(query);
  if (total > MAX_ROWS)
    throw fail(
      400,
      `Too many records (${total}). Narrow the filters (max ${MAX_ROWS}).`,
    );
  return total;
}

export async function fetchReport(
  hotelId,
  type,
  filters = {},
  { limit = 0 } = {},
) {
  const def = DEFS[type];
  const query = await def.filter(hotelId, filters ?? {});
  const total = await def.model.countDocuments(query);
  if (!limit && total > MAX_ROWS)
    throw fail(
      400,
      `Too many records (${total}). Narrow the filters (max ${MAX_ROWS}).`,
    );

  let q = def.model.find(query).sort(def.sort).populate(def.populate).lean();
  if (limit) q = q.limit(limit);
  const docs = await q;
  const ctx = def.context ? await def.context(docs) : {};

  return {
    columns: def.columns,
    rows: docs.map((d) => def.row(d, ctx)),
    total,
  };
}
