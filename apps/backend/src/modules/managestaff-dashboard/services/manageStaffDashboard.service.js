import mongoose from "mongoose";

import { AttendanceRecord } from "../../attendance/models/attendanceRecord.js";
import { buildMatch } from "../../attendance/services/attendance.service.js";
import {
  Staff,
  StaffDepartment,
} from "../../staff-management/models/staffManagement.js";
import { getDailyReport } from "../../staff-reports/services/staffReport.service.js";
import { ApiError } from "../../../utils/http.js";
import * as time from "../../../utils/attendanceTime.js";

const DEVICE_MODEL = "AttendanceDevice";
const RANGES = ["week", "month"];
const TOP_DEPARTMENTS = 6;
const RECENT_ROWS = 5;
const DEVICE_ROWS = 5;
const MAX_RECORDS = 20000;
const DEVICE_ONLINE_MINUTES =
  Number(process.env.DASHBOARD_DEVICE_ONLINE_MINUTES) || 5;
const FALLBACK_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#06b6d4",
];

const round1 = (n) => Math.round(n * 10) / 10;
const idString = (value) => (value ? String(value) : "");
const percentOf = (n, total) => (total ? round1((n / total) * 100) : 0);

export const parseQuery = (query = {}) => {
  const date = query.date ? String(query.date).trim() : time.todayKey();
  if (!time.isDateKey(date))
    throw new ApiError(400, "date must be a date like 2026-10-07.");

  const range = String(query.range || "week").toLowerCase();
  if (!RANGES.includes(range))
    throw new ApiError(400, `range must be one of ${RANGES.join(", ")}.`);

  return { date, range };
};

const endOfDay = (dateKey) =>
  new Date(
    time.wallTimeToInstant(time.addDays(dateKey, 1), "00:00").getTime() - 1,
  );

const lastDayOfPreviousMonth = (dateKey) =>
  time.addDays(`${dateKey.slice(0, 7)}-01`, -1);

const activeStaff = (hotelId, asOf) => ({
  hotelId,
  deletedAt: null,
  status: "ACTIVE",
  joinedOn: { $lte: endOfDay(asOf) },
});

const headcountChange = async (hotelId, date, current) => {
  const previous = await Staff.countDocuments(
    activeStaff(hotelId, lastDayOfPreviousMonth(date)),
  );
  if (!previous)
    return { value: current, previous: null, change: null, trend: null };

  const change = round1(((current - previous) / previous) * 100);
  return {
    value: current,
    previous,
    change,
    trend: change > 0 ? "UP" : change < 0 ? "DOWN" : "FLAT",
  };
};

const departmentHeadcount = async (hotelId, date, total) => {
  const staff = await Staff.find(activeStaff(hotelId, date))
    .select("departmentId")
    .lean();

  const counts = new Map();
  for (const member of staff) {
    const key = idString(member.departmentId);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const departments = await StaffDepartment.find({
    hotelId,
    _id: { $in: [...counts.keys()].filter(Boolean) },
  })
    .select("name color")
    .lean();
  const byId = new Map(departments.map((d) => [String(d._id), d]));

  const ranked = [...counts]
    .map(([key, count]) => ({
      _id: key || null,
      name: byId.get(key)?.name || "Unassigned",
      color: byId.get(key)?.color || null,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const top = ranked.slice(0, TOP_DEPARTMENTS).map((d, i) => ({
    ...d,
    color: d.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }));
  const others = ranked
    .slice(TOP_DEPARTMENTS)
    .reduce((sum, d) => sum + d.count, 0);

  return { total, departments: top, others };
};

const BUCKET = {
  PRESENT: "present",
  HALF_DAY: "present",
  LATE: "late",
  ABSENT: "absent",
  ON_LEAVE: "onLeave",
};

const attendanceOverview = async (hotelId, { date, range }) => {
  const from =
    range === "week" ? time.addDays(date, -6) : `${date.slice(0, 7)}-01`;
  const records = await AttendanceRecord.find(
    await buildMatch(hotelId, { from, to: date }),
  )
    .select("date status")
    .limit(MAX_RECORDS)
    .lean();

  const days = new Map(
    time
      .eachDate(from, date)
      .map((d) => [d, { date: d, present: 0, late: 0, absent: 0, onLeave: 0 }]),
  );
  for (const record of records) {
    const bucket = BUCKET[String(record.status || "").toUpperCase()];
    if (bucket && days.has(record.date)) days.get(record.date)[bucket] += 1;
  }

  return { range, from, to: date, days: [...days.values()] };
};

const firstAndLast = async (hotelId, date) => {
  const match = await buildMatch(hotelId, { from: date, to: date });
  const [first, last] = await Promise.all([
    AttendanceRecord.findOne({ ...match, checkInAt: { $ne: null } })
      .sort({ checkInAt: 1 })
      .select("staffId checkInAt")
      .lean(),
    AttendanceRecord.findOne({ ...match, checkOutAt: { $ne: null } })
      .sort({ checkOutAt: -1 })
      .select("staffId checkOutAt")
      .lean(),
  ]);

  const staff = await Staff.find({
    hotelId,
    _id: { $in: [first?.staffId, last?.staffId].filter(Boolean).map(String) },
  })
    .select("name staffCode")
    .lean();
  const byId = new Map(staff.map((s) => [String(s._id), s]));
  const who = (record) => {
    const member = byId.get(idString(record?.staffId));
    return member
      ? {
          _id: member._id,
          name: member.name,
          staffCode: member.staffCode || "-",
        }
      : { _id: record?.staffId || null, name: "Unknown", staffCode: "-" };
  };

  return {
    firstCheckIn: first ? { at: first.checkInAt, staff: who(first) } : null,
    lastCheckOut: last ? { at: last.checkOutAt, staff: who(last) } : null,
  };
};

const SEEN_FIELDS = [
  "lastSeenAt",
  "lastHeartbeatAt",
  "lastPingAt",
  "lastSyncAt",
  "lastActiveAt",
];

const readDevice = (doc, now) => {
  const seen = SEEN_FIELDS.map((field) => doc[field]).find(Boolean) || null;
  const status = String(doc.status || "").toUpperCase();

  const online = seen
    ? now - new Date(seen).getTime() <= DEVICE_ONLINE_MINUTES * 60000
    : ["ONLINE", "ACTIVE"].includes(status);

  return {
    _id: doc._id,
    name: doc.name ?? doc.deviceName ?? doc.code ?? "Device",
    online,
    lastSeenAt: seen,
  };
};

const deviceStatus = async (hotelId) => {
  const Device = mongoose.models[DEVICE_MODEL];
  if (!Device) return [];

  const filter = Device.schema?.path?.("hotelId") ? { hotelId } : {};
  const docs = await Device.find(filter).lean();
  const now = Date.now();

  return docs
    .map((doc) => readDevice(doc, now))
    .sort(
      (a, b) =>
        Number(b.online) - Number(a.online) ||
        new Date(b.lastSeenAt || 0) - new Date(a.lastSeenAt || 0),
    )
    .slice(0, DEVICE_ROWS);
};

export const getDashboard = async (hotelId, query = {}) => {
  const f = parseQuery(query);

  const [daily, overview, ends, devices] = await Promise.all([
    getDailyReport(hotelId, {
      date: f.date,
      page: 1,
      limit: RECENT_ROWS,
      sort: "checkInAt",
      direction: "desc",
    }),
    attendanceOverview(hotelId, f),
    firstAndLast(hotelId, f.date),
    deviceStatus(hotelId),
  ]);

  const k = daily.kpis;
  const total = k.totalStaff;
  const present = k.present + k.earlyLeave;
  const card = (value) => ({ value, percent: percentOf(value, total) });

  const [totalStaff, departmentStaff] = await Promise.all([
    headcountChange(hotelId, f.date, total),
    departmentHeadcount(hotelId, f.date, total),
  ]);

  return {
    date: f.date,
    kpis: {
      totalStaff,
      present: card(present),
      late: card(k.late),
      absent: card(k.absent),
      onLeave: card(k.onLeave),
    },
    attendanceOverview: overview,
    departmentStaff,
    todayStatus: { presentRate: percentOf(present, total), ...ends },
    recentAttendance: daily.records.rows,
    devices,
  };
};
