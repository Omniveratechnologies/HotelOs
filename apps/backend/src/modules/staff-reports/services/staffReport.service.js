import mongoose from "mongoose";

import { AttendanceRecord } from "../../attendance/models/attendanceRecord.js";
import { AttendanceRule } from "../../attendance/models/attendanceRule.js";
import { buildMatch } from "../../attendance/services/attendance.service.js";
import {
  Staff,
  StaffDepartment,
  StaffDesignation,
} from "../../staff-management/models/staffManagement.js";
import { StaffShift } from "../../staff-management/models/staffShift.js";
import { ApiError, isObjectId } from "../../../utils/http.js";
import * as time from "../../../utils/attendanceTime.js";

const DEVICE_MODEL = "AttendanceDevice";
const DEFAULT_EARLY_LEAVE_TOLERANCE = 10;
const MAX_RECORDS = 5000;
const LEAVE_STATUSES = ["ON_LEAVE", "HOLIDAY"];
const TABLE_STATUSES = [
  "PRESENT",
  "LATE",
  "EARLY_LEAVE",
  "ABSENT",
  ...LEAVE_STATUSES,
];
const SORTS = ["name", "checkInAt", "checkOutAt", "workMinutes", "status"];

const pad = (n) => String(n).padStart(2, "0");
const round1 = (n) => Math.round(n * 10) / 10;
const idString = (value) => (value ? String(value) : "");
const isSet = (v) =>
  v !== undefined &&
  v !== null &&
  v !== "" &&
  String(v).toUpperCase() !== "ALL";
const average = (values) =>
  values.length
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : null;

export const formatClock = (minutes) => {
  if (minutes === null || minutes === undefined) return null;
  const h24 = Math.floor(minutes / 60) % 24;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${pad(h12)}:${pad(minutes % 60)} ${h24 < 12 ? "AM" : "PM"}`;
};

const readId = (value, name) => {
  if (!isSet(value)) return null;
  if (!isObjectId(value)) throw new ApiError(400, `${name} is not valid.`);
  return String(value);
};

export const parseQuery = (query = {}) => {
  const date = isSet(query.date) ? String(query.date).trim() : time.todayKey();
  if (!time.isDateKey(date))
    throw new ApiError(400, "date must be a date like 2026-10-07.");

  let status = null;
  if (isSet(query.status)) {
    status = String(query.status).trim().toUpperCase().replace(/\s+/g, "_");
    if (!TABLE_STATUSES.includes(status))
      throw new ApiError(
        400,
        `status must be one of ${TABLE_STATUSES.join(", ")}.`,
      );
  }

  return {
    date,
    status,
    departmentId: readId(
      query.department_id ?? query.departmentId,
      "department_id",
    ),
    designationId: readId(
      query.designation_id ?? query.designationId,
      "designation_id",
    ),
    deviceId: readId(query.device_id ?? query.deviceId, "device_id"),
    page: Math.max(1, Number(query.page) || 1),
    limit: Math.min(100, Math.max(1, Number(query.limit) || 10)),
    sort: SORTS.includes(query.sort) ? query.sort : "checkInAt",
    direction: String(query.direction).toLowerCase() === "desc" ? -1 : 1,
  };
};

export const classify = (
  record,
  shift,
  tolerance,
  tz = time.hotelTimezone(),
) => {
  const status = String(record.status || "").toUpperCase();
  if (status === "ABSENT" || LEAVE_STATUSES.includes(status)) return status;

  if (status === "PRESENT" && record.checkOutAt && shift) {
    const end = time.shiftWindow(record.date, shift, tz)?.end;
    if (
      end &&
      new Date(record.checkOutAt).getTime() <
        new Date(end).getTime() - tolerance * 60000
    ) {
      return "EARLY_LEAVE";
    }
  }
  return status === "LATE" ? "LATE" : "PRESENT";
};

const compareBy = (sort, direction, lookups) => {
  const staffName = (item) =>
    lookups.staff.get(idString(item.record.staffId))?.name || "";
  const value = {
    name: staffName,
    checkInAt: (item) => item.record.checkInAt,
    checkOutAt: (item) => item.record.checkOutAt,
    workMinutes: (item) =>
      item.record.checkOutAt ? item.record.workMinutes || 0 : null,
    status: (item) => item.status,
  }[sort];

  return (a, b) => {
    const x = value(a);
    const y = value(b);
    if (x === null || x === undefined)
      return y === null || y === undefined ? 0 : 1;
    if (y === null || y === undefined) return -1;
    const order =
      typeof x === "string" ? x.localeCompare(y) : new Date(x) - new Date(y);
    return order * direction;
  };
};

const toRow = ({ record, status }, lookups) => {
  const staff = lookups.staff.get(idString(record.staffId));
  const department = lookups.departments.get(idString(record.departmentId));
  const designation = lookups.designations.get(idString(record.designationId));
  const device = lookups.devices.get(idString(record.checkInDeviceId));

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
          color: department.color || "#3b82f6",
        }
      : null,
    designation: designation
      ? { _id: designation._id, name: designation.name }
      : null,
    checkInAt: record.checkInAt || null,
    checkOutAt: record.checkOutAt || null,
    workMinutes: record.workMinutes || 0,
    workingHours:
      record.checkInAt && record.checkOutAt
        ? time.formatMinutes(record.workMinutes)
        : "-",
    status,
    device: record.checkInAt
      ? {
          _id: record.checkInDeviceId || null,
          name: record.checkInDeviceId
            ? device?.name || "Unknown device"
            : "Manual entry",
        }
      : null,
  };
};

export const computeReport = ({
  date,
  records,
  totalStaff,
  previousAttended = null,
  lookups,
  tolerance = DEFAULT_EARLY_LEAVE_TOLERANCE,
  filters = {},
  tz = time.hotelTimezone(),
}) => {
  const items = records.map((record) => ({
    record,
    status: classify(
      record,
      lookups.shifts.get(idString(record.shiftId)),
      tolerance,
      tz,
    ),
  }));
  const attendance = items.filter(
    (item) => !LEAVE_STATUSES.includes(item.status),
  );
  const count = (...statuses) =>
    items.filter((item) => statuses.includes(item.status)).length;

  const counts = {
    present: count("PRESENT"),
    late: count("LATE"),
    earlyLeave: count("EARLY_LEAVE"),
    absent: count("ABSENT"),
    onLeave: count(...LEAVE_STATUSES),
  };
  const attended = counts.present + counts.late + counts.earlyLeave;
  const total = totalStaff ?? records.length;
  const recordedStaff = new Set(records.map((r) => idString(r.staffId))).size;
  const notMarked = Math.max(total - recordedStaff, 0);
  const pct = (n) => (total ? round1((n / total) * 100) : 0);

  const byDepartment = new Map();
  for (const { record, status } of attendance) {
    const key = idString(record.departmentId);
    if (!byDepartment.has(key)) {
      const department = lookups.departments.get(key);
      byDepartment.set(key, {
        _id: record.departmentId || null,
        name: department?.name || "Unassigned",
        color: department?.color || "#3b82f6",
        present: 0,
        late: 0,
        earlyLeave: 0,
        absent: 0,
        total: 0,
      });
    }
    const bar = byDepartment.get(key);
    bar[
      {
        PRESENT: "present",
        LATE: "late",
        EARLY_LEAVE: "earlyLeave",
        ABSENT: "absent",
      }[status]
    ] += 1;
    bar.total += 1;
  }

  const byDevice = new Map();
  for (const { record } of attendance) {
    if (!record.checkInAt) continue;
    const key = idString(record.checkInDeviceId) || "MANUAL";
    if (!byDevice.has(key)) {
      const device = lookups.devices.get(key);
      byDevice.set(key, {
        _id: record.checkInDeviceId || null,
        name:
          key === "MANUAL" ? "Manual entry" : device?.name || "Unknown device",
        records: 0,
        onlinePercent: device?.onlinePercent ?? null,
      });
    }
    byDevice.get(key).records += 1;
  }

  const avgIn = average(
    records
      .filter((r) => r.checkInAt)
      .map((r) => time.minutesOfDay(r.checkInAt, tz)),
  );
  const avgOut = average(
    records
      .filter((r) => r.checkOutAt)
      .map((r) => time.minutesOfDay(r.checkOutAt, tz)),
  );
  const avgWork = average(
    records.filter((r) => r.checkOutAt).map((r) => r.workMinutes || 0),
  );

  const tableItems = (
    filters.status
      ? items.filter((item) => item.status === filters.status)
      : attendance
  ).sort(
    compareBy(filters.sort || "checkInAt", filters.direction || 1, lookups),
  );
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const skip = (page - 1) * limit;

  return {
    date,
    kpis: {
      totalStaff: total,
      present: counts.present,
      absent: counts.absent,
      late: counts.late,
      earlyLeave: counts.earlyLeave,
      onLeave: counts.onLeave,
      notMarked,
      attended,
      percentages: {
        present: pct(counts.present),
        absent: pct(counts.absent),
        late: pct(counts.late),
        earlyLeave: pct(counts.earlyLeave),
        onLeave: pct(counts.onLeave),
        notMarked: pct(notMarked),
        attended: pct(attended),
      },
    },
    overview: {
      total,
      series: [
        { status: "PRESENT", count: counts.present },
        { status: "ABSENT", count: counts.absent },
        { status: "LATE", count: counts.late },
        { status: "EARLY_LEAVE", count: counts.earlyLeave },
        ...(counts.onLeave
          ? [{ status: "ON_LEAVE", count: counts.onLeave }]
          : []),
        ...(notMarked ? [{ status: "NOT_MARKED", count: notMarked }] : []),
      ].map((slice) => ({ ...slice, percent: pct(slice.count) })),
    },
    departments: [...byDepartment.values()].sort((a, b) => b.total - a.total),
    devices: [...byDevice.values()]
      .sort((a, b) => b.records - a.records)
      .slice(0, 10),
    insights: {
      averageCheckIn: { minutes: avgIn, label: formatClock(avgIn) },
      averageCheckOut: { minutes: avgOut, label: formatClock(avgOut) },
      averageWorkHours: {
        minutes: avgWork,
        label: avgWork === null ? null : time.formatMinutes(avgWork),
      },
      vsPreviousDay: {
        attended,
        previousAttended,
        changePercent: previousAttended
          ? round1(((attended - previousAttended) / previousAttended) * 100)
          : null,
      },
    },
    records: {
      count: tableItems.length,
      rows: tableItems
        .slice(skip, skip + limit)
        .map((item) => toRow(item, lookups)),
      pagination: {
        page,
        limit,
        total: tableItems.length,
        totalPages: Math.max(1, Math.ceil(tableItems.length / limit)),
        from: tableItems.length ? skip + 1 : 0,
        to: Math.min(skip + limit, tableItems.length),
      },
    },
  };
};

const dayMatch = async (hotelId, date, f) => {
  const match = await buildMatch(hotelId, {
    from: date,
    to: date,
    departmentId: f.departmentId,
    designationId: f.designationId,
  });
  if (f.deviceId)
    match.$or = [
      { checkInDeviceId: f.deviceId },
      { checkOutDeviceId: f.deviceId },
    ];
  return match;
};

const loadRecords = async (hotelId, f) =>
  AttendanceRecord.find(await dayMatch(hotelId, f.date, f))
    .select(
      "staffId departmentId designationId shiftId date status checkInAt checkOutAt workMinutes checkInDeviceId checkOutDeviceId",
    )
    .limit(MAX_RECORDS)
    .lean();

const loadLookups = async (hotelId, records) => {
  const ids = (key) => [
    ...new Set(
      records
        .map((r) => r[key])
        .filter(Boolean)
        .map(String),
    ),
  ];
  const byId = (list) => new Map(list.map((item) => [String(item._id), item]));

  const Device = mongoose.models[DEVICE_MODEL];
  const deviceIds = ids("checkInDeviceId");

  const [staff, departments, designations, shifts, devices] = await Promise.all(
    [
      Staff.find({ hotelId, _id: { $in: ids("staffId") } })
        .select("name staffCode photoUrl")
        .lean(),
      StaffDepartment.find({ hotelId, _id: { $in: ids("departmentId") } })
        .select("name code color")
        .lean(),
      StaffDesignation.find({ hotelId, _id: { $in: ids("designationId") } })
        .select("name code")
        .lean(),
      StaffShift.find({ hotelId, _id: { $in: ids("shiftId") } })
        .select("name startTime endTime")
        .lean(),
      Device && deviceIds.length
        ? Device.find({ _id: { $in: deviceIds } }).lean()
        : [],
    ],
  );

  return {
    staff: byId(staff),
    departments: byId(departments),
    designations: byId(designations),
    shifts: byId(shifts),
    devices: byId(
      devices.map((d) => ({
        ...d,
        name: d.name ?? d.deviceName ?? d.code ?? "",
        onlinePercent: d.uptimePercent ?? d.onlinePercent ?? null,
      })),
    ),
  };
};

// Staff who belong in the day's total: everyone ACTIVE (not deleted) who had joined by that date,
// PLUS anyone who already has a record that day (so the total is never smaller than the table).
const countStaff = (hotelId, f, recordedIds = []) => {
  const endOfDay = new Date(
    time.wallTimeToInstant(time.addDays(f.date, 1), "00:00").getTime() - 1,
  );
  const active = {
    deletedAt: null,
    status: "ACTIVE",
    joinedOn: { $lte: endOfDay },
  };
  if (f.departmentId) active.departmentId = f.departmentId;
  if (f.designationId) active.designationId = f.designationId;

  return Staff.countDocuments({
    hotelId,
    $or: [active, { _id: { $in: recordedIds } }],
  });
};

const countAttended = async (hotelId, date, f) =>
  AttendanceRecord.countDocuments({
    ...(await dayMatch(hotelId, date, f)),
    status: { $in: ["PRESENT", "LATE"] },
  });

const run = async (hotelId, query, { withPrevious }) => {
  const f = parseQuery(query);
  const [records, rule, previousAttended] = await Promise.all([
    loadRecords(hotelId, f),
    AttendanceRule.findOne({ hotelId }).lean(),
    withPrevious
      ? countAttended(hotelId, time.addDays(f.date, -1), f)
      : Promise.resolve(null),
  ]);

  // needs the records first, so staff with a record are always counted
  const staffTotal = f.deviceId
    ? null
    : await countStaff(hotelId, f, [
        ...new Set(records.map((r) => idString(r.staffId)).filter(Boolean)),
      ]);

  return computeReport({
    date: f.date,
    records,
    totalStaff: staffTotal,
    previousAttended,
    lookups: await loadLookups(hotelId, records),
    tolerance:
      rule?.earlyLeaveToleranceMinutes ?? DEFAULT_EARLY_LEAVE_TOLERANCE,
    filters: f,
  });
};

export const getDailyReport = (hotelId, query = {}) =>
  run(hotelId, query, { withPrevious: true });

export const getDailyRecords = async (hotelId, query = {}) => {
  const report = await run(hotelId, query, { withPrevious: false });
  return { rows: report.records.rows, pagination: report.records.pagination };
};
