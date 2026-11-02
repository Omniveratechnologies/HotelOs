import crypto from "node:crypto";

import { AttendanceRecord } from "../../attendance/models/attendanceRecord.js";
import {
  Staff,
  StaffDepartment,
} from "../../staff-management/models/staffManagement.js";
import { MonthlyStaffSummary } from "../models/monthlyStaffSummary.js";
import {
  attendancePercent,
  bandOf,
  buildStaffRows,
  byId,
  exportMonthlyStaff,
  getMonthlyStaff,
  monthRange,
  paginate,
  parseQuery,
  previousMonth,
  staffCountsForMonth,
  totalDaysOf,
  workingDaysOf,
} from "./monthlyReport.service.js";
import { isMonthLocked } from "./monthLock.service.js";
import { ApiError, isObjectId } from "../../../utils/http.js";
import * as time from "../../../utils/attendanceTime.js";

const MAX_AGE_MINUTES = 30;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const idString = (value) => (value ? String(value) : "");
const actorRef = (actor = {}) => ({
  id: actor.userId ? String(actor.userId) : "",
  name: actor.name || "",
});

const readMonth = (value) => {
  const month = String(value ?? "").trim();
  if (!MONTH_RE.test(month))
    throw new ApiError(400, "month must look like 2026-10.");
  return month;
};

export const refreshMonth = async (hotelId, month) => {
  if (await isMonthLocked(hotelId, month))
    throw new ApiError(409, `${month} is locked and cannot be recalculated.`);

  await MonthlyStaffSummary.updateMany(
    { hotelId, month, locked: { $ne: true } },
    { $set: { stale: false } },
  );

  const counts = await staffCountsForMonth(hotelId, month);
  const staff = await Staff.find({
    hotelId,
    _id: { $in: counts.map((c) => c.staffId) },
  })
    .select("departmentId")
    .lean();
  const departmentOf = new Map(
    staff.map((s) => [String(s._id), s.departmentId || null]),
  );
  const now = new Date();

  const ops = counts.map(({ staffId, counts: c }) => ({
    updateOne: {
      filter: { hotelId, month, staffId },
      update: {
        $set: {
          departmentId: departmentOf.get(staffId) ?? null,
          present: c.present,
          late: c.late,
          halfDay: c.halfDay,
          absent: c.absent,
          onLeave: c.onLeave,
          holiday: c.holiday,
          totalDays: totalDaysOf(c),
          workingDays: workingDaysOf(c),
          attendancePercent: attendancePercent(c),
          computedAt: now,
        },
        $setOnInsert: { stale: false, locked: false },
      },
      upsert: true,
    },
  }));

  try {
    if (ops.length)
      await MonthlyStaffSummary.bulkWrite(ops, { ordered: false });
  } catch (error) {
    if (error?.code !== 11000 && !error?.writeErrors) throw error;
  }

  await MonthlyStaffSummary.deleteMany({
    hotelId,
    month,
    locked: { $ne: true },
    staffId: { $nin: counts.map((c) => c.staffId) },
  });

  return { month, staff: counts.length, computedAt: now };
};

export const ensureFresh = async (hotelId, month) => {
  if (await isMonthLocked(hotelId, month)) return;
  const oldest = await MonthlyStaffSummary.findOne({ hotelId, month })
    .sort({ computedAt: 1 })
    .select("computedAt")
    .lean();
  const tooOld =
    !oldest ||
    Date.now() - new Date(oldest.computedAt).getTime() >
      MAX_AGE_MINUTES * 60000;
  if (
    tooOld ||
    (await MonthlyStaffSummary.exists({ hotelId, month, stale: true }))
  )
    await refreshMonth(hotelId, month);
};

export const refreshRecentMonths = async (hotelId, today = time.todayKey()) => {
  const done = [];
  for (const month of [today.slice(0, 7), previousMonth(today.slice(0, 7))]) {
    if (!(await isMonthLocked(hotelId, month))) {
      await refreshMonth(hotelId, month);
      done.push(month);
    }
  }
  return done;
};

export const getLockInfo = async (hotelId, month, { departmentId } = {}) => {
  const row = await MonthlyStaffSummary.findOne({
    hotelId,
    month,
    locked: true,
  })
    .select("lockedAt lockedBy")
    .lean();
  if (!row) return { month, locked: false };

  const filter = { hotelId, month };
  if (departmentId && isObjectId(departmentId))
    filter.departmentId = departmentId;
  return {
    month,
    locked: true,
    lockedAt: row.lockedAt,
    lockedBy: row.lockedBy,
    staffCount: await MonthlyStaffSummary.countDocuments(filter),
  };
};

export const lockMonth = async (hotelId, body = {}, actor = {}) => {
  const month = readMonth(body.month);
  const today = time.todayKey();
  const { monthEnd } = monthRange(month, today);

  if (monthEnd >= today)
    throw new ApiError(
      400,
      "Only a finished month can be locked. Wait until the month has ended.",
    );
  if (await isMonthLocked(hotelId, month))
    throw new ApiError(409, `${month} is already locked.`);

  const open = await AttendanceRecord.countDocuments({
    hotelId,
    date: { $gte: `${month}-01`, $lte: monthEnd },
    checkInAt: { $ne: null },
    checkOutAt: null,
  });
  if (open > 0 && body.force !== true) {
    throw new ApiError(
      409,
      `${open} record(s) still have a check-in without a check-out. Correct them first, or lock again with force.`,
    );
  }

  await refreshMonth(hotelId, month);

  const now = new Date();
  const by = actorRef(actor);
  const note = String(body.note ?? "")
    .trim()
    .slice(0, 300);
  const result = await MonthlyStaffSummary.updateMany(
    { hotelId, month },
    {
      $set: { locked: true, lockedAt: now, lockedBy: by, stale: false },
      $push: {
        events: { $each: [{ action: "LOCK", at: now, by, note }], $slice: -20 },
      },
    },
  );
  if (!result.matchedCount)
    throw new ApiError(
      409,
      "Nothing to lock: there are no attendance records for that month.",
    );

  return getLockInfo(hotelId, month);
};

export const unlockMonth = async (hotelId, body = {}, actor = {}) => {
  const month = readMonth(body.month);
  const reason = String(body.reason ?? "").trim();
  if (reason.length < 3 || reason.length > 300)
    throw new ApiError(
      400,
      "A reason (3-300 characters) is required to unlock a month.",
    );

  const now = new Date();
  const result = await MonthlyStaffSummary.updateMany(
    { hotelId, month, locked: true },
    {
      $set: { locked: false, stale: true },
      $unset: { lockedAt: 1, lockedBy: 1 },
      $push: {
        events: {
          $each: [
            { action: "UNLOCK", at: now, by: actorRef(actor), note: reason },
          ],
          $slice: -20,
        },
      },
    },
  );
  if (!result.matchedCount) throw new ApiError(409, `${month} is not locked.`);

  return getLockInfo(hotelId, month);
};

const summaryItems = async (hotelId, f) => {
  await ensureFresh(hotelId, f.month);

  const filter = { hotelId, month: f.month };
  if (f.departmentId) filter.departmentId = f.departmentId;
  const docs = await MonthlyStaffSummary.find(filter).lean();

  const [staff, departments] = await Promise.all([
    Staff.find({ hotelId, _id: { $in: docs.map((d) => d.staffId) } })
      .select("name staffCode photoUrl")
      .lean(),
    StaffDepartment.find({
      hotelId,
      _id: {
        $in: [
          ...new Set(docs.map((d) => idString(d.departmentId)).filter(Boolean)),
        ],
      },
    })
      .select("name")
      .lean(),
  ]);

  const stored = new Map(docs.map((d) => [String(d.staffId), d]));
  const staffMap = byId(
    staff.map((s) => ({
      ...s,
      departmentId: stored.get(String(s._id))?.departmentId,
    })),
  );

  const KEYS = [
    ["PRESENT", "present"],
    ["LATE", "late"],
    ["HALF_DAY", "halfDay"],
    ["ABSENT", "absent"],
    ["ON_LEAVE", "onLeave"],
    ["HOLIDAY", "holiday"],
  ];
  const rows = docs.flatMap((d) =>
    KEYS.filter(([, key]) => d[key] > 0).map(([bucket, key]) => ({
      _id: { s: d.staffId, b: bucket },
      count: d[key],
    })),
  );

  const items = buildStaffRows({
    rows,
    staffMap,
    departmentMap: byId(departments),
    filters: f,
  });
  for (const item of items) {
    const row = stored.get(item.staff._id);
    if (row && row.attendancePercent !== undefined) {
      item.attendancePercent = row.attendancePercent;
      item.band = bandOf(row.attendancePercent);
    }
  }
  return items;
};

export const getStaffTable = async (hotelId, query = {}) => {
  const f = parseQuery(query);
  return paginate(await summaryItems(hotelId, f), f);
};

export const getStaffExport = async (hotelId, query = {}) => {
  const f = parseQuery(query);
  if (f.deviceId) return exportMonthlyStaff(hotelId, query);
  return { month: f.month, rows: await summaryItems(hotelId, f) };
};

export const PAYROLL_COLUMNS = [
  ["Staff ID", (r) => r.staffCode],
  ["Name", (r) => r.name],
  ["Department", (r) => r.department],
  ["Month", (r) => r.month],
  ["Working Days", (r) => r.workingDays],
  ["Days Present", (r) => r.daysPresent],
  ["Late Days", (r) => r.lateDays],
  ["Half Days", (r) => r.halfDays],
  ["Absent Days", (r) => r.absentDays],
  ["Leave Days", (r) => r.leaveDays],
  ["Holiday Days", (r) => r.holidayDays],
  ["Payable Attendance Days", (r) => r.payableDays],
  [
    "Attendance %",
    (r) => (r.attendancePercent === null ? "" : r.attendancePercent),
  ],
];

export const payrollExport = async (hotelId, query = {}) => {
  const month = readMonth(query.month);
  const lock = await getLockInfo(hotelId, month);
  if (!lock.locked)
    throw new ApiError(
      409,
      `${month} is not locked. Lock the month before exporting it to payroll.`,
    );

  const docs = await MonthlyStaffSummary.find({ hotelId, month }).lean();
  const [staff, departments] = await Promise.all([
    Staff.find({ hotelId, _id: { $in: docs.map((d) => d.staffId) } })
      .select("name staffCode")
      .lean(),
    StaffDepartment.find({
      hotelId,
      _id: {
        $in: [
          ...new Set(docs.map((d) => idString(d.departmentId)).filter(Boolean)),
        ],
      },
    })
      .select("name")
      .lean(),
  ]);
  const staffMap = byId(staff);
  const departmentMap = byId(departments);

  const rows = docs
    .map((d) => ({
      staffCode: staffMap.get(String(d.staffId))?.staffCode || "-",
      name: staffMap.get(String(d.staffId))?.name || "Unknown",
      department: departmentMap.get(idString(d.departmentId))?.name || "",
      month,
      workingDays: d.workingDays,
      daysPresent: d.present + d.late,
      lateDays: d.late,
      halfDays: d.halfDay,
      absentDays: d.absent,
      leaveDays: d.onLeave,
      holidayDays: d.holiday,
      payableDays: d.present + d.late + 0.5 * d.halfDay,
      attendancePercent: d.attendancePercent ?? null,
    }))
    .sort((a, b) => a.staffCode.localeCompare(b.staffCode));

  const checksum = crypto
    .createHash("sha256")
    .update(JSON.stringify(rows))
    .digest("hex");
  return {
    month,
    lockedAt: lock.lockedAt,
    lockedBy: lock.lockedBy,
    checksum,
    rows,
  };
};
