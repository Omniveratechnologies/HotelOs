import mongoose from "mongoose";

import { AttendanceRecord } from "../../attendance/models/attendanceRecord.js";
import { AttendanceRule } from "../../attendance/models/attendanceRule.js";
import { buildMatch } from "../../attendance/services/attendance.service.js";
import {
  Staff,
  StaffDepartment,
} from "../../staff-management/models/staffManagement.js";
import { ApiError, isObjectId } from "../../../utils/http.js";
import * as time from "../../../utils/attendanceTime.js";

const DEVICE_MODEL = "AttendanceDevice";
const DEFAULT_HALF_DAY_MINUTES = 240;
const WEEKLY_OFF_WEEKDAYS = [];
const EXCLUDE_APPROVED_LEAVE_FROM_WORKING_DAYS = false;
const BANDS = { good: 90, warning: 75 };
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const STATUS_FILTERS = ["PRESENT", "LATE", "HALF_DAY", "ABSENT", "ON_LEAVE"];
const SORTS = [
  "name",
  "staffCode",
  "attendancePercent",
  "present",
  "absent",
  "late",
  "leave",
  "halfDay",
];

const BUCKET_KEY = {
  PRESENT: "present",
  LATE: "late",
  HALF_DAY: "halfDay",
  ABSENT: "absent",
  ON_LEAVE: "onLeave",
  HOLIDAY: "holiday",
};

const pad = (n) => String(n).padStart(2, "0");
const round1 = (n) => Math.round(n * 10) / 10;
const idString = (value) => (value ? String(value) : "");
const isSet = (v) =>
  v !== undefined &&
  v !== null &&
  v !== "" &&
  String(v).toUpperCase() !== "ALL";

export const monthRange = (month, today) => {
  const [y, m] = month.split("-").map(Number);
  const nextFirst = m === 12 ? `${y + 1}-01-01` : `${y}-${pad(m + 1)}-01`;
  const monthEnd = time.addDays(nextFirst, -1);
  return {
    from: `${month}-01`,
    to: monthEnd < today ? monthEnd : today,
    monthEnd,
  };
};

export const previousMonth = (month) => {
  const [y, m] = month.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${pad(m - 1)}`;
};

export const previousRange = (month, range) => {
  const prev = previousMonth(month);
  const full = monthRange(prev, "9999-12-31");
  const day = Math.min(
    Number(range.to.slice(8)),
    Number(full.monthEnd.slice(8)),
  );
  return { from: full.from, to: `${prev}-${pad(day)}` };
};

const readId = (value, name) => {
  if (!isSet(value)) return null;
  if (!isObjectId(value)) throw new ApiError(400, `${name} is not valid.`);
  return String(value);
};

export const parseQuery = (query = {}, today = time.todayKey()) => {
  const month = isSet(query.month)
    ? String(query.month).trim()
    : today.slice(0, 7);
  if (!MONTH_RE.test(month))
    throw new ApiError(400, "month must look like 2026-10.");
  if (`${month}-01` > today)
    throw new ApiError(400, "That month has not started yet.");

  let status = null;
  if (isSet(query.status)) {
    status = String(query.status).trim().toUpperCase().replace(/\s+/g, "_");
    if (!STATUS_FILTERS.includes(status))
      throw new ApiError(
        400,
        `status must be one of ${STATUS_FILTERS.join(", ")}.`,
      );
  }

  return {
    month,
    status,
    departmentId: readId(
      query.department_id ?? query.departmentId,
      "department_id",
    ),
    deviceId: readId(query.device_id ?? query.deviceId, "device_id"),
    q: String(query.q ?? query.search ?? "")
      .trim()
      .toLowerCase(),
    page: Math.max(1, Number(query.page) || 1),
    limit: Math.min(100, Math.max(1, Number(query.limit) || 10)),
    sort: SORTS.includes(query.sort) ? query.sort : "name",
    direction: String(query.direction).toLowerCase() === "desc" ? -1 : 1,
  };
};

export const emptyCounts = () => ({
  present: 0,
  late: 0,
  halfDay: 0,
  absent: 0,
  onLeave: 0,
  holiday: 0,
});
export const totalDaysOf = (c) =>
  c.present + c.late + c.halfDay + c.absent + c.onLeave + c.holiday;
export const workingDaysOf = (c) =>
  c.present +
  c.late +
  c.halfDay +
  c.absent +
  (EXCLUDE_APPROVED_LEAVE_FROM_WORKING_DAYS ? 0 : c.onLeave);

export const attendancePercent = (c) => {
  const working = workingDaysOf(c);
  return working
    ? round1(((c.present + c.late + 0.5 * c.halfDay) / working) * 100)
    : null;
};

export const bandOf = (percent) =>
  percent === null
    ? null
    : percent >= BANDS.good
      ? "GOOD"
      : percent >= BANDS.warning
        ? "WARNING"
        : "POOR";

export const compare = (current, previous, unit) => {
  if (
    current === null ||
    current === undefined ||
    previous === null ||
    previous === undefined
  ) {
    return { previous: previous ?? null, change: null, unit, trend: null };
  }
  let change;
  if (unit === "points") change = round1(current - previous);
  else if (previous === 0) change = current === 0 ? 0 : null;
  else change = round1(((current - previous) / previous) * 100);

  const trend =
    change === null
      ? current > previous
        ? "UP"
        : "FLAT"
      : change > 0
        ? "UP"
        : change < 0
          ? "DOWN"
          : "FLAT";
  return { previous, change, unit, trend };
};

const countsOf = (rows = []) => {
  const counts = emptyCounts();
  for (const row of rows)
    if (BUCKET_KEY[row._id]) counts[BUCKET_KEY[row._id]] = row.count;
  return counts;
};

const groupCounts = (rows = [], keyOf) => {
  const groups = new Map();
  for (const row of rows) {
    const key = keyOf(row._id);
    if (!groups.has(key)) groups.set(key, emptyCounts());
    groups.get(key)[BUCKET_KEY[row._id.b]] += row.count;
  }
  return groups;
};

export const assembleReport = ({
  month,
  range,
  totalStaff,
  current,
  previous,
  lookups,
}) => {
  const now = countsOf(current.overall);
  const before = previous ? countsOf(previous.overall) : null;
  const nowPercent = attendancePercent(now);
  const beforePercent = before ? attendancePercent(before) : null;

  const kpis = {
    totalStaff,
    averageAttendance: {
      value: nowPercent,
      ...compare(nowPercent, beforePercent, "points"),
    },
    absentDays: {
      value: now.absent,
      ...compare(now.absent, before?.absent, "percent"),
    },
    lateDays: {
      value: now.late,
      ...compare(now.late, before?.late, "percent"),
    },
    leaveDays: {
      value: now.onLeave,
      ...compare(now.onLeave, before?.onLeave, "percent"),
    },
  };

  const total = totalDaysOf(now);
  const pct = (n) => (total ? round1((n / total) * 100) : 0);
  const distribution = {
    total,
    series: [
      { status: "PRESENT", count: now.present },
      { status: "ABSENT", count: now.absent },
      { status: "LATE", count: now.late },
      { status: "ON_LEAVE", count: now.onLeave },
      { status: "HALF_DAY", count: now.halfDay },
      ...(now.holiday ? [{ status: "HOLIDAY", count: now.holiday }] : []),
    ].map((slice) => ({ ...slice, percent: pct(slice.count) })),
  };

  const daily = groupCounts(current.daily, (id) => id.d);
  const trend = time.eachDate(range.from, range.to).map((date) => {
    const counts = daily.get(date) || emptyCounts();
    return { date, ...counts, attendancePercent: attendancePercent(counts) };
  });

  const departments = [
    ...groupCounts(current.departments, (id) => idString(id.d)),
  ]
    .map(([key, counts]) => {
      const doc = lookups.departments.get(key);
      return {
        _id: key || null,
        name: doc?.name || "Unassigned",
        color: doc?.color || "#3b82f6",
        ...counts,
        records: totalDaysOf(counts),
        attendancePercent: attendancePercent(counts),
      };
    })
    .sort((a, b) => b.records - a.records);

  const devices = [
    ...groupCounts(current.devices, (id) => idString(id.v) || "MANUAL"),
  ]
    .map(([key, counts]) => {
      const checkIns = counts.present + counts.late + counts.halfDay;
      return {
        _id: key === "MANUAL" ? null : key,
        name:
          key === "MANUAL"
            ? "Manual entry"
            : lookups.devices.get(key)?.name || "Unknown device",
        checkIns,
        onTimePercent: checkIns
          ? round1(((counts.present + counts.halfDay) / checkIns) * 100)
          : null,
        ...counts,
      };
    })
    .sort((a, b) => b.checkIns - a.checkIns);

  return {
    month,
    range: {
      from: range.from,
      to: range.to,
      monthEnd: range.monthEnd,
      partial: range.to < range.monthEnd,
    },
    kpis,
    distribution,
    trend,
    departments,
    devices,
  };
};

export const buildStaffRows = ({
  rows,
  staffMap,
  departmentMap,
  filters = {},
}) => {
  const perStaff = groupCounts(rows, (id) => idString(id.s));

  let items = [...perStaff].map(([staffId, counts]) => {
    const staff = staffMap.get(staffId);
    const department = departmentMap.get(idString(staff?.departmentId));
    const percent = attendancePercent(counts);
    return {
      staff: {
        _id: staffId,
        name: staff?.name || "Unknown",
        staffCode: staff?.staffCode || "-",
        photoUrl: staff?.photoUrl || "",
      },
      department: department
        ? { _id: department._id, name: department.name }
        : null,
      present: counts.present,
      absent: counts.absent,
      late: counts.late,
      leave: counts.onLeave,
      halfDay: counts.halfDay,
      holiday: counts.holiday,
      totalDays: totalDaysOf(counts),
      workingDays: workingDaysOf(counts),
      attendancePercent: percent,
      band: bandOf(percent),
    };
  });

  if (filters.q) {
    items = items.filter(
      (i) =>
        i.staff.name.toLowerCase().includes(filters.q) ||
        i.staff.staffCode.toLowerCase().includes(filters.q),
    );
  }
  if (filters.status) {
    const key = {
      PRESENT: "present",
      LATE: "late",
      HALF_DAY: "halfDay",
      ABSENT: "absent",
      ON_LEAVE: "leave",
    }[filters.status];
    items = items.filter((i) => i[key] > 0);
  }

  const sort = filters.sort || "name";
  const direction = filters.direction || 1;
  const value = (i) =>
    sort === "name"
      ? i.staff.name
      : sort === "staffCode"
        ? i.staff.staffCode
        : i[sort];
  items.sort((a, b) => {
    const x = value(a);
    const y = value(b);
    if (x === null || x === undefined)
      return y === null || y === undefined ? 0 : 1;
    if (y === null || y === undefined) return -1;
    return (typeof x === "string" ? x.localeCompare(y) : x - y) * direction;
  });
  return items;
};

const paginate = (items, f) => {
  const skip = (f.page - 1) * f.limit;
  return {
    rows: items.slice(skip, skip + f.limit),
    pagination: {
      page: f.page,
      limit: f.limit,
      total: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / f.limit)),
      from: items.length ? skip + 1 : 0,
      to: Math.min(skip + f.limit, items.length),
    },
  };
};

const offDatesIn = (from, to) =>
  WEEKLY_OFF_WEEKDAYS.length
    ? time
        .eachDate(from, to)
        .filter((d) =>
          WEEKLY_OFF_WEEKDAYS.includes(new Date(`${d}T00:00:00Z`).getUTCDay()),
        )
    : [];

const rangeMatch = async (hotelId, from, to, f) => {
  const match = await buildMatch(hotelId, {
    from,
    to,
    departmentId: f.departmentId,
  });
  const and = [];
  if (f.deviceId) {
    const id = new mongoose.Types.ObjectId(f.deviceId);
    and.push({ $or: [{ checkInDeviceId: id }, { checkOutDeviceId: id }] });
  }
  const off = offDatesIn(from, to);
  if (off.length)
    and.push({
      $nor: [
        {
          date: { $in: off },
          status: { $in: ["ABSENT", "ON_LEAVE", "HOLIDAY"] },
        },
      ],
    });
  if (and.length) match.$and = and;
  return match;
};

const prelude = (halfDayMinutes) => [
  { $addFields: { _s: { $toUpper: { $ifNull: ["$status", ""] } } } },
  {
    $addFields: {
      _b: {
        $switch: {
          branches: [
            { case: { $eq: ["$_s", "ABSENT"] }, then: "ABSENT" },
            { case: { $eq: ["$_s", "ON_LEAVE"] }, then: "ON_LEAVE" },
            { case: { $eq: ["$_s", "HOLIDAY"] }, then: "HOLIDAY" },
            {
              case: {
                $or: [
                  { $eq: ["$_s", "HALF_DAY"] },
                  {
                    $and: [
                      { $gt: ["$checkOutAt", null] },
                      { $gt: ["$workMinutes", 0] },
                      { $lt: ["$workMinutes", halfDayMinutes] },
                    ],
                  },
                ],
              },
              then: "HALF_DAY",
            },
            { case: { $eq: ["$_s", "LATE"] }, then: "LATE" },
          ],
          default: "PRESENT",
        },
      },
    },
  },
];

const group = (id) => [{ $group: { _id: id, count: { $sum: 1 } } }];

const dashboardPipeline = (match, half) => [
  { $match: match },
  ...prelude(half),
  {
    $facet: {
      overall: group("$_b"),
      daily: group({ d: "$date", b: "$_b" }),
      departments: group({ d: "$departmentId", b: "$_b" }),
      devices: [
        { $match: { checkInAt: { $ne: null } } },
        ...group({ v: "$checkInDeviceId", b: "$_b" }),
      ],
    },
  },
];

const overallPipeline = (match, half) => [
  { $match: match },
  ...prelude(half),
  { $facet: { overall: group("$_b") } },
];
const staffPipeline = (match, half) => [
  { $match: match },
  ...prelude(half),
  ...group({ s: "$staffId", b: "$_b" }),
];

const byId = (list) => new Map(list.map((item) => [String(item._id), item]));

const halfDayMinutesFor = async (hotelId) => {
  const rule = await AttendanceRule.findOne({ hotelId }).lean();
  return rule?.halfDayMinutes ?? DEFAULT_HALF_DAY_MINUTES;
};

const countStaff = (hotelId, f, asOf) => {
  const endOfDay = new Date(
    time.wallTimeToInstant(time.addDays(asOf, 1), "00:00").getTime() - 1,
  );
  const filter = {
    hotelId,
    deletedAt: null,
    status: "ACTIVE",
    joinedOn: { $lte: endOfDay },
  };
  if (f.departmentId) filter.departmentId = f.departmentId;
  return Staff.countDocuments(filter);
};

const loadDevices = async (ids) => {
  const Device = mongoose.models[DEVICE_MODEL];
  if (!Device || !ids.length) return new Map();
  const docs = await Device.find({ _id: { $in: ids } }).lean();
  return byId(
    docs.map((d) => ({ ...d, name: d.name ?? d.deviceName ?? d.code ?? "" })),
  );
};

const loadStaffItems = async (hotelId, f, half) => {
  const range = monthRange(f.month, time.todayKey());
  const rows = await AttendanceRecord.aggregate(
    staffPipeline(await rangeMatch(hotelId, range.from, range.to, f), half),
  );

  const staffIds = [
    ...new Set(rows.map((r) => idString(r._id.s)).filter(Boolean)),
  ];
  const staff = await Staff.find({ hotelId, _id: { $in: staffIds } })
    .select("name staffCode photoUrl departmentId")
    .lean();
  const departments = await StaffDepartment.find({
    hotelId,
    _id: {
      $in: [
        ...new Set(staff.map((s) => idString(s.departmentId)).filter(Boolean)),
      ],
    },
  })
    .select("name")
    .lean();

  return buildStaffRows({
    rows,
    staffMap: byId(staff),
    departmentMap: byId(departments),
    filters: f,
  });
};

export const getMonthlyReport = async (hotelId, query = {}) => {
  const f = parseQuery(query);
  const range = monthRange(f.month, time.todayKey());
  const prev = previousRange(f.month, range);
  const half = await halfDayMinutesFor(hotelId);

  const [[current], [previous], totalStaff] = await Promise.all([
    rangeMatch(hotelId, range.from, range.to, f).then((m) =>
      AttendanceRecord.aggregate(dashboardPipeline(m, half)),
    ),
    rangeMatch(hotelId, prev.from, prev.to, f).then((m) =>
      AttendanceRecord.aggregate(overallPipeline(m, half)),
    ),
    countStaff(hotelId, f, range.to),
  ]);

  const [departments, devices] = await Promise.all([
    StaffDepartment.find({
      hotelId,
      _id: { $in: current.departments.map((r) => r._id.d).filter(Boolean) },
    })
      .select("name color")
      .lean(),
    loadDevices([
      ...new Set(current.devices.map((r) => idString(r._id.v)).filter(Boolean)),
    ]),
  ]);

  return assembleReport({
    month: f.month,
    range,
    totalStaff,
    current,
    previous,
    lookups: { departments: byId(departments), devices },
  });
};

export const getMonthlyStaff = async (hotelId, query = {}) => {
  const f = parseQuery(query);
  return paginate(
    await loadStaffItems(hotelId, f, await halfDayMinutesFor(hotelId)),
    f,
  );
};

export const EXPORT_COLUMNS = [
  ["Staff ID", (r) => r.staff.staffCode],
  ["Name", (r) => r.staff.name],
  ["Department", (r) => r.department?.name || ""],
  ["Present", (r) => r.present],
  ["Absent", (r) => r.absent],
  ["Late", (r) => r.late],
  ["Leave", (r) => r.leave],
  ["Half Day", (r) => r.halfDay],
  ["Holiday", (r) => r.holiday],
  ["Total Days", (r) => r.totalDays],
  ["Working Days", (r) => r.workingDays],
  [
    "Attendance %",
    (r) => (r.attendancePercent === null ? "" : r.attendancePercent),
  ],
];

export const exportMonthlyStaff = async (hotelId, query = {}) => {
  const f = parseQuery(query);
  return {
    month: f.month,
    rows: await loadStaffItems(hotelId, f, await halfDayMinutesFor(hotelId)),
  };
};

export const staffCountsForMonth = async (hotelId, month) => {
  const range = monthRange(month, time.todayKey());
  const half = await halfDayMinutesFor(hotelId);
  const rows = await AttendanceRecord.aggregate(
    staffPipeline(await rangeMatch(hotelId, range.from, range.to, {}), half),
  );
  return [...groupCounts(rows, (id) => idString(id.s))].map(
    ([staffId, counts]) => ({ staffId, counts }),
  );
};

export { byId, paginate };
