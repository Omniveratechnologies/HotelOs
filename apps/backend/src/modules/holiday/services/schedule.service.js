import mongoose from "mongoose";
import {
  Staff,
  StaffDepartment,
} from "../../staff-management/models/staffManagement.js";
import { StaffShift } from "../../staff-management/models/staffShift.js";
import { AttendanceRecord } from "../../attendance/models/attendanceRecord.js";
import { LeaveRequest } from "../../leave/models/leaveRequest.js";
import { ShiftAssignment } from "../models/shiftAssignment.js";
import { ApiError, isObjectId } from "../../../utils/http.js";
import * as time from "../../../utils/attendanceTime.js";
import * as rules from "./shiftRules.js";
import { shiftView, findShift } from "./shift.service.js";

const MAX_BULK_DAYS = 92;
const MAX_AUTO_DAYS = 62;
const MAX_ROSTER_DAYS = 14;
const MAX_REPORT_DAYS = 93;
const MAX_LIMIT = 100;
const LIST_CAP = 200;

const STATUS_LABELS = {
  ON_DUTY: "On Duty",
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  MISSED: "Missed",
  ABSENT: "Absent",
};
const STATUS_RANK = {
  ON_DUTY: 0,
  SCHEDULED: 1,
  MISSED: 2,
  ABSENT: 3,
  COMPLETED: 4,
};

const toId = (value) => new mongoose.Types.ObjectId(String(value));
const percentOf = (part, total) =>
  total > 0 ? Math.round((part / total) * 100) : 0;
const sid = (value) => String(value);

export const weeklyOffDays = () =>
  String(
    process.env.SCHEDULE_WEEKLY_OFF_DAYS ??
      process.env.LEAVE_WEEKLY_OFF_DAYS ??
      "0",
  )
    .split(",")
    .map((value) => value.trim())
    .filter((value) => /^[0-6]$/.test(value))
    .map(Number);

const minRestHours = () =>
  Math.max(0, Number(process.env.SHIFT_MIN_REST_HOURS ?? 8));
const dutyToleranceMs = () =>
  Math.max(0, Number(process.env.SHIFT_ONDUTY_TOLERANCE_MINUTES ?? 120)) *
  60000;

const readDate = (value, label) => {
  const key = String(value ?? "").trim();
  if (!time.isDateKey(key))
    throw new ApiError(400, `${label} must be a date like 2026-10-07.`);
  return key;
};

const readRange = (from, to, maxDays, { future = false } = {}) => {
  const fromDate = readDate(from, "From date");
  const toDate = readDate(to ?? from, "To date");
  if (toDate < fromDate)
    throw new ApiError(400, "The end date can't be before the start date.");
  if (time.eachDate(fromDate, toDate).length > maxDays)
    throw new ApiError(400, `Choose at most ${maxDays} days at a time.`);
  if (future && fromDate < time.todayKey())
    throw new ApiError(
      400,
      "Past days can't be rescheduled. Start from today.",
    );
  return { fromDate, toDate };
};

const readPaging = (query, defaultLimit = 10) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(query.limit) || defaultLimit),
  );
  return { page, limit };
};

const paginate = (items, { page, limit }) => ({
  rows: items.slice((page - 1) * limit, page * limit),
  pagination: {
    page,
    limit,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / limit)),
  },
});

const readIds = (list, label) => {
  if (list === undefined || list === null) return [];
  if (!Array.isArray(list)) throw new ApiError(400, `${label} must be a list.`);
  const ids = [...new Set(list.map(String))];
  if (ids.some((id) => !isObjectId(id)))
    throw new ApiError(400, `${label} has an invalid ID.`);
  return ids;
};

const holidayRows = async (hotelId, from, to) => {
  const Holiday = mongoose.models.StaffHoliday;
  const byDate = new Map();
  if (!Holiday) return byDate;
  const rows = await Holiday.find({ hotelId, date: { $gte: from, $lte: to } })
    .select("date appliesToDepartments holidayDuty")
    .lean();
  rows.forEach((row) =>
    byDate.set(row.date, [...(byDate.get(row.date) || []), row]),
  );
  return byDate;
};

const closesFor = (rows, member) =>
  (rows || []).some(
    (row) =>
      !row.holidayDuty &&
      (!row.appliesToDepartments?.length ||
        row.appliesToDepartments.some(
          (id) => sid(id) === sid(member.departmentId),
        )),
  );

export const loadContext = async (
  hotelId,
  from,
  to,
  { departmentId, staffIds } = {},
) => {
  const paddedFrom = time.addDays(from, -1);
  const paddedTo = time.addDays(to, 1);

  const staffQuery = { hotelId, deletedAt: null, status: "ACTIVE" };
  if (departmentId) staffQuery.departmentId = toId(departmentId);
  if (staffIds?.length) staffQuery._id = { $in: staffIds.map(toId) };

  const [staff, shiftDocs, departmentDocs] = await Promise.all([
    Staff.find(staffQuery).sort({ name: 1 }).lean(),
    StaffShift.find({ hotelId }).sort({ sortOrder: 1, name: 1 }).lean(),
    StaffDepartment.find({ hotelId }).lean(),
  ]);

  const ids = staff.map((member) => member._id);
  const idSet = new Set(ids.map(sid));

  const [assignmentDocs, leaveDocs, holidays] = await Promise.all([
    ids.length
      ? ShiftAssignment.find({
          hotelId,
          date: { $gte: paddedFrom, $lte: paddedTo },
          staffId: { $in: ids },
        }).lean()
      : [],
    ids.length
      ? LeaveRequest.find({
          hotelId,
          status: "APPROVED",
          fromDate: { $lte: paddedTo },
          toDate: { $gte: paddedFrom },
          staffId: { $in: ids },
        }).lean()
      : [],
    holidayRows(hotelId, paddedFrom, paddedTo),
  ]);

  const shifts = new Map(shiftDocs.map((shift) => [sid(shift._id), shift]));
  const departments = new Map(
    departmentDocs.map((department) => [sid(department._id), department]),
  );
  const staffById = new Map(staff.map((member) => [sid(member._id), member]));

  const assignments = new Map(
    assignmentDocs.map((row) => [`${sid(row.staffId)}|${row.date}`, row]),
  );

  const onLeave = new Set();
  for (const leave of leaveDocs) {
    if (!idSet.has(sid(leave.staffId))) continue;
    const start = leave.fromDate > paddedFrom ? leave.fromDate : paddedFrom;
    const end = leave.toDate < paddedTo ? leave.toDate : paddedTo;
    for (const day of time.eachDate(start, end))
      onLeave.add(`${sid(leave.staffId)}|${day}`);
  }

  const off = new Set(weeklyOffDays());
  const overrides = new Map();

  const cell = (staffId, date) => {
    const key = `${sid(staffId)}|${date}`;
    const member = staffById.get(sid(staffId));
    if (!member)
      return {
        state: "UNASSIGNED",
        source: "UNASSIGNED",
        shift: null,
        explicit: false,
      };
    if (onLeave.has(key))
      return { state: "LEAVE", source: "LEAVE", shift: null, explicit: false };

    const row = overrides.has(key) ? overrides.get(key) : assignments.get(key);
    if (row) {
      if (!row.shiftId)
        return { state: "OFF", source: "OFF", shift: null, explicit: true };
      const shift = shifts.get(sid(row.shiftId)) || null;
      return shift
        ? {
            state: "SHIFT",
            source: "ASSIGNED",
            shift,
            explicit: true,
            assignedFrom: row.source,
          }
        : {
            state: "UNASSIGNED",
            source: "UNASSIGNED",
            shift: null,
            explicit: true,
          };
    }

    if (closesFor(holidays.get(date), member))
      return {
        state: "HOLIDAY",
        source: "HOLIDAY",
        shift: null,
        explicit: false,
      };
    if (off.has(rules.weekdayOf(date)))
      return {
        state: "WEEKLY_OFF",
        source: "WEEKLY_OFF",
        shift: null,
        explicit: false,
      };

    const fallback = member.shiftId ? shifts.get(sid(member.shiftId)) : null;
    if (fallback && fallback.isActive !== false)
      return {
        state: "SHIFT",
        source: "DEFAULT",
        shift: fallback,
        explicit: false,
      };
    return {
      state: "UNASSIGNED",
      source: "UNASSIGNED",
      shift: null,
      explicit: false,
    };
  };

  return {
    staff,
    staffIds: ids,
    staffById,
    shifts,
    departments,
    cell,
    isHoliday: (date) => holidays.has(date),
    isClosed: (date) =>
      (holidays.get(date) || []).some(
        (row) => !row.holidayDuty && !row.appliesToDepartments?.length,
      ),
    set: (staffId, date, shiftId) =>
      overrides.set(`${sid(staffId)}|${date}`, {
        shiftId: shiftId || null,
        source: "PLAN",
      }),
  };
};

const staffMini = (member) => ({
  _id: member._id,
  name: member.name,
  staffCode: member.staffCode,
  photoUrl: member.photoUrl || null,
});

const departmentMini = (ctx, member) => {
  const department = member.departmentId
    ? ctx.departments.get(sid(member.departmentId))
    : null;
  return department
    ? {
        _id: department._id,
        name: department.name,
        color: department.color || null,
      }
    : null;
};

const shiftMini = (shift) =>
  shift
    ? {
        _id: shift._id,
        name: shift.name,
        color: shift.color || "#3B82F6",
        startTime: shift.startTime,
        endTime: shift.endTime,
      }
    : null;

const statusOf = ({ record, shift, date, now }) => {
  if (record?.checkInAt) return record.checkOutAt ? "COMPLETED" : "ON_DUTY";
  if (record?.status === "ABSENT") return "ABSENT";
  const { end } = rules.shiftInstants(date, shift);
  return now > end ? "MISSED" : "SCHEDULED";
};

const daySnapshot = async (hotelId, date, filter = {}, now = new Date()) => {
  const ctx = await loadContext(hotelId, date, date, filter);
  const records = ctx.staffIds.length
    ? await AttendanceRecord.find({
        hotelId,
        date,
        staffId: { $in: ctx.staffIds },
      }).lean()
    : [];
  const byStaff = new Map(
    records.map((record) => [sid(record.staffId), record]),
  );

  const rows = [];
  for (const member of ctx.staff) {
    const entry = ctx.cell(member._id, date);
    if (entry.state !== "SHIFT" || !entry.shift) continue;
    const record = byStaff.get(sid(member._id)) || null;
    rows.push({
      member,
      entry,
      record,
      status: statusOf({ record, shift: entry.shift, date, now }),
    });
  }
  return { ctx, rows };
};

const rowView = (ctx, date, { member, entry, record, status }) => ({
  staff: staffMini(member),
  department: departmentMini(ctx, member),
  shift: {
    ...shiftMini(entry.shift),
    timeLabel: shiftView(entry.shift).timeLabel,
  },
  source: entry.source,
  date,
  checkIn: rules.clock(record?.checkInAt),
  checkInAt: record?.checkInAt || null,
  checkOut: rules.clock(record?.checkOutAt),
  checkOutAt: record?.checkOutAt || null,
  attendanceStatus: record?.status || null,
  status,
  statusLabel: STATUS_LABELS[status],
});

const sortRows = (rows) =>
  [...rows].sort((a, b) => {
    const rank = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (rank) return rank;
    const start =
      time.toMinutes(a.entry.shift.startTime) -
      time.toMinutes(b.entry.shift.startTime);
    return start || String(a.member.name).localeCompare(String(b.member.name));
  });

const countOnDuty = async (hotelId, ctx, today, now) => {
  if (!ctx.staffIds.length) return 0;
  const open = await AttendanceRecord.find({
    hotelId,
    date: { $in: [time.addDays(today, -1), today] },
    checkInAt: { $ne: null },
    checkOutAt: null,
    staffId: { $in: ctx.staffIds },
  }).lean();

  return open.filter((record) => {
    const shift = record.shiftId ? ctx.shifts.get(sid(record.shiftId)) : null;
    if (!shift) return record.date === today;
    return (
      now.getTime() <=
      rules.shiftInstants(record.date, shift).end.getTime() + dutyToleranceMs()
    );
  }).length;
};

export const listShifts = async (hotelId, query = {}) => {
  const today = time.todayKey();
  const [shifts, { rows }] = await Promise.all([
    StaffShift.find({ hotelId }).sort({ sortOrder: 1, name: 1 }).lean(),
    daySnapshot(hotelId, today),
  ]);

  const counts = new Map();
  rows.forEach(({ entry }) =>
    counts.set(
      sid(entry.shift._id),
      (counts.get(sid(entry.shift._id)) || 0) + 1,
    ),
  );

  const status = String(query.status || "ALL").toUpperCase();
  const q = String(query.q || "")
    .trim()
    .toLowerCase();
  return shifts
    .filter(
      (shift) =>
        status === "ALL" ||
        (status === "ACTIVE"
          ? shift.isActive !== false
          : shift.isActive === false),
    )
    .filter((shift) => !q || shift.name.toLowerCase().includes(q))
    .map((shift) => shiftView(shift, counts.get(sid(shift._id)) || 0));
};

export const summary = async (hotelId, query = {}) => {
  const now = new Date();
  const today = time.todayKey(undefined, now);
  const date = query.date ? readDate(query.date, "Date") : today;
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.todayLimit) || 5));

  const { ctx, rows } = await daySnapshot(hotelId, date, {}, now);
  const allShifts = [...ctx.shifts.values()];

  const counts = new Map();
  rows.forEach(({ entry }) =>
    counts.set(
      sid(entry.shift._id),
      (counts.get(sid(entry.shift._id)) || 0) + 1,
    ),
  );

  const assignedToday = rows.length;
  const totalStaff = ctx.staff.length;
  const onDutyNow =
    date === today
      ? await countOnDuty(hotelId, ctx, today, now)
      : rows.filter((row) => row.status === "ON_DUTY").length;
  const offDuty = Math.max(0, assignedToday - onDutyNow);

  const shifts = allShifts.map((shift) =>
    shiftView(shift, counts.get(sid(shift._id)) || 0),
  );
  const items = shifts
    .filter((shift) => shift.assignedCount > 0 || shift.isActive)
    .map((shift) => ({
      shiftId: shift._id,
      name: shift.name,
      color: shift.color,
      count: shift.assignedCount,
      percent: percentOf(shift.assignedCount, assignedToday),
    }));

  const sorted = sortRows(rows);
  return {
    date,
    isToday: date === today,
    stats: {
      totalShifts: shifts.filter((shift) => shift.isActive).length,
      assignedToday,
      onDutyNow,
      offDuty,
      totalStaff,
      percent: {
        assigned: percentOf(assignedToday, totalStaff),
        onDuty: percentOf(onDutyNow, totalStaff),
        offDuty: percentOf(offDuty, totalStaff),
      },
    },
    shifts,
    distribution: { total: assignedToday, items },
    today: {
      total: sorted.length,
      rows: sorted.slice(0, limit).map((row) => rowView(ctx, date, row)),
    },
  };
};

export const listSchedule = async (hotelId, query = {}) => {
  const now = new Date();
  const date = query.date
    ? readDate(query.date, "Date")
    : time.todayKey(undefined, now);
  if (query.department_id && !isObjectId(query.department_id))
    throw new ApiError(400, "Invalid department.");
  if (query.shift_id && !isObjectId(query.shift_id))
    throw new ApiError(400, "Invalid shift.");

  const { ctx, rows } = await daySnapshot(
    hotelId,
    date,
    { departmentId: query.department_id },
    now,
  );

  const status = String(query.status || "ALL").toUpperCase();
  const q = String(query.q || "")
    .trim()
    .toLowerCase();

  const scoped = rows
    .filter(
      (row) => !query.shift_id || sid(row.entry.shift._id) === query.shift_id,
    )
    .filter((row) => {
      if (!q) return true;
      const department = departmentMini(ctx, row.member)?.name || "";
      return [
        row.member.name,
        row.member.staffCode,
        department,
        row.entry.shift.name,
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(q),
      );
    });

  const counts = {
    ALL: scoped.length,
    ON_DUTY: 0,
    SCHEDULED: 0,
    COMPLETED: 0,
    MISSED: 0,
    ABSENT: 0,
  };
  scoped.forEach((row) => {
    counts[row.status] += 1;
  });

  const filtered =
    status === "ALL" ? scoped : scoped.filter((row) => row.status === status);
  const { rows: pageRows, pagination } = paginate(
    sortRows(filtered),
    readPaging(query),
  );
  return {
    date,
    counts,
    rows: pageRows.map((row) => rowView(ctx, date, row)),
    pagination,
  };
};

const readMonth = (value) => {
  const month = String(value || time.todayKey().slice(0, 7)).trim();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
    throw new ApiError(400, "Month must look like 2026-10.");
  const from = `${month}-01`;
  const next = new Date(
    Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 1),
  );
  const to = time.addDays(next.toISOString().slice(0, 10), -1);
  return { month, from, to };
};
export const calendar = async (hotelId, query = {}) => {
  const { month, from, to } = readMonth(query.month);
  if (query.department_id && !isObjectId(query.department_id))
    throw new ApiError(400, "Invalid department.");

  const ctx = await loadContext(hotelId, from, to, {
    departmentId: query.department_id,
  });
  const today = time.todayKey();

  const days = time.eachDate(from, to).map((date) => {
    const counts = new Map();
    let total = 0;
    for (const member of ctx.staff) {
      const entry = ctx.cell(member._id, date);
      if (entry.state !== "SHIFT" || !entry.shift) continue;
      counts.set(
        sid(entry.shift._id),
        (counts.get(sid(entry.shift._id)) || 0) + 1,
      );
      total += 1;
    }
    return {
      date,
      weekday: rules.weekdayOf(date),
      isToday: date === today,
      isHoliday: ctx.isHoliday(date),
      total,
      shifts: [...ctx.shifts.values()]
        .filter((shift) => counts.has(sid(shift._id)))
        .map((shift) => ({
          shiftId: shift._id,
          name: shift.name,
          color: shift.color || "#3B82F6",
          count: counts.get(sid(shift._id)),
        })),
    };
  });

  return {
    month,
    from,
    to,
    today,
    firstWeekday: rules.weekdayOf(from),
    legend: [...ctx.shifts.values()]
      .filter((shift) => shift.isActive !== false)
      .map((shift) => ({
        shiftId: shift._id,
        name: shift.name,
        color: shift.color || "#3B82F6",
      })),
    days,
  };
};

export const roster = async (hotelId, query = {}) => {
  const today = time.todayKey();
  const { fromDate, toDate } = readRange(
    query.from || today,
    query.to || time.addDays(query.from || today, 6),
    MAX_ROSTER_DAYS,
  );
  if (query.department_id && !isObjectId(query.department_id))
    throw new ApiError(400, "Invalid department.");

  const ctx = await loadContext(hotelId, fromDate, toDate, {
    departmentId: query.department_id,
  });
  const q = String(query.q || "")
    .trim()
    .toLowerCase();
  const dates = time.eachDate(fromDate, toDate);

  const people = ctx.staff.filter((member) => {
    if (!q) return true;
    const department = departmentMini(ctx, member)?.name || "";
    return [member.name, member.staffCode, department].some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(q),
    );
  });

  const { rows, pagination } = paginate(people, readPaging(query, 20));
  return {
    from: fromDate,
    to: toDate,
    dates,
    legend: [...ctx.shifts.values()]
      .filter((shift) => shift.isActive !== false)
      .map((shift) => shiftMini(shift)),
    rows: rows.map((member) => ({
      staff: staffMini(member),
      department: departmentMini(ctx, member),
      defaultShift:
        member.shiftId && ctx.shifts.get(sid(member.shiftId))
          ? shiftMini(ctx.shifts.get(sid(member.shiftId)))
          : null,
      days: dates.map((date) => {
        const entry = ctx.cell(member._id, date);
        return {
          date,
          state: entry.state,
          source: entry.source,
          explicit: entry.explicit,
          shift: shiftMini(entry.shift),
        };
      }),
    })),
    pagination,
  };
};

const neighbours = (ctx, staffId, date, shift) => {
  const mine = rules.absWindows(date, shift);
  let overlap = null;
  let gap = null;

  for (const offset of [-1, 1]) {
    const day = time.addDays(date, offset);
    const other = ctx.cell(staffId, day);
    if (other.state !== "SHIFT" || !other.shift) continue;
    const theirs = rules.absWindows(day, other.shift);
    if (rules.windowsOverlap(mine, theirs)) {
      overlap = { date: day, shift: other.shift };
      continue;
    }
    const between =
      offset === -1
        ? rules.gapBetween(theirs, mine)
        : rules.gapBetween(mine, theirs);
    gap = gap === null ? between : Math.min(gap, between);
  }
  return { overlap, gap };
};

const restShort = (gap, restHours) => gap !== null && gap < restHours * 60;

const persist = async (hotelId, ops, { source, actor }) => {
  const writes = ops.map((op) => ({
    updateOne: {
      filter: { hotelId, staffId: toId(op.staffId), date: op.date },
      update: {
        $set: {
          hotelId,
          staffId: toId(op.staffId),
          date: op.date,
          shiftId: op.shiftId ? toId(op.shiftId) : null,
          source,
          assignedByName: actor?.name || "",
        },
      },
      upsert: true,
    },
  }));
  for (let i = 0; i < writes.length; i += 500)
    await ShiftAssignment.bulkWrite(writes.slice(i, i + 500), {
      ordered: false,
    });
};

const capped = (list) => ({
  items: list.slice(0, LIST_CAP),
  total: list.length,
});

const readTargets = (body) => {
  const staffIds = readIds(
    body.staffIds ?? (body.staffId ? [body.staffId] : undefined),
    "Staff",
  );
  const departmentId = body.departmentId ? String(body.departmentId) : "";
  if (departmentId && !isObjectId(departmentId))
    throw new ApiError(400, "Invalid department.");
  if (!staffIds.length && !departmentId)
    throw new ApiError(400, "Pick staff or a department.");
  return { staffIds, departmentId };
};

export const bulkAssign = async (hotelId, body = {}, actor = null) => {
  const { fromDate, toDate } = readRange(
    body.fromDate,
    body.toDate,
    MAX_BULK_DAYS,
    { future: true },
  );
  const { staffIds, departmentId } = readTargets(body);

  const daysOfWeek =
    body.daysOfWeek === undefined ? null : readDays(body.daysOfWeek);
  const shift = body.shiftId
    ? await findShift(hotelId, body.shiftId, { activeOnly: true })
    : null;
  if (body.shiftId === undefined)
    throw new ApiError(400, "Choose a shift, or shiftId null for a day off.");

  const ctx = await loadContext(hotelId, fromDate, toDate, {
    departmentId: departmentId || undefined,
    staffIds,
  });
  if (!ctx.staff.length) throw new ApiError(404, "No active staff matched.");

  const restHours = minRestHours();
  const result = {
    assigned: 0,
    replaced: 0,
    unchanged: 0,
    skipped: [],
    warnings: [],
  };
  const ops = [];

  const dates = time
    .eachDate(fromDate, toDate)
    .filter(
      (date) => !daysOfWeek || daysOfWeek.includes(rules.weekdayOf(date)),
    );
  const skip = (member, date, reason) =>
    result.skipped.push({
      staffId: member._id,
      staffName: member.name,
      date,
      reason,
    });

  for (const date of dates) {
    for (const member of ctx.staff) {
      const entry = ctx.cell(member._id, date);

      if (entry.state === "LEAVE") {
        skip(member, date, "On approved leave.");
        continue;
      }

      const sameAlready =
        entry.explicit &&
        (shift
          ? entry.shift && sid(entry.shift._id) === sid(shift._id)
          : entry.state === "OFF");
      if (sameAlready) {
        result.unchanged += 1;
        continue;
      }

      if (entry.explicit && !body.overwrite) {
        skip(
          member,
          date,
          entry.state === "OFF"
            ? "Already marked as a day off."
            : `Already scheduled on ${entry.shift?.name || "another shift"}.`,
        );
        continue;
      }

      if (shift) {
        const check = neighbours(ctx, member._id, date, shift);
        if (check.overlap) {
          skip(
            member,
            date,
            `Overlaps ${check.overlap.shift.name} on ${check.overlap.date}.`,
          );
          continue;
        }
        if (restShort(check.gap, restHours)) {
          if (body.strictRest) {
            skip(member, date, `Less than ${restHours}h rest between shifts.`);
            continue;
          }
          result.warnings.push({
            staffId: member._id,
            staffName: member.name,
            date,
            message: `Only ${Math.round((check.gap / 60) * 10) / 10}h rest between shifts.`,
          });
        }
      }

      if (entry.explicit) result.replaced += 1;
      result.assigned += 1;
      ctx.set(member._id, date, shift?._id || null);
      ops.push({ staffId: member._id, date, shiftId: shift?._id || null });
    }
  }

  if (!body.dryRun && ops.length)
    await persist(hotelId, ops, {
      source: ops.length === 1 && staffIds.length === 1 ? "MANUAL" : "BULK",
      actor,
    });

  return {
    dryRun: Boolean(body.dryRun),
    shift: shift ? shiftMini(shift) : null,
    range: { from: fromDate, to: toDate, days: dates.length },
    staffCount: ctx.staff.length,
    assigned: result.assigned,
    replaced: result.replaced,
    unchanged: result.unchanged,
    skipped: capped(result.skipped),
    warnings: capped(result.warnings),
  };
};

const readDays = (list) => {
  if (
    !Array.isArray(list) ||
    list.some((day) => !Number.isInteger(day) || day < 0 || day > 6)
  ) {
    throw new ApiError(
      400,
      "daysOfWeek must be numbers 0 (Sunday) to 6 (Saturday).",
    );
  }
  return list;
};

// POST /schedule/clear { staffIds[] | departmentId, fromDate, toDate }
export const clearAssignments = async (hotelId, body = {}) => {
  const { fromDate, toDate } = readRange(
    body.fromDate,
    body.toDate,
    MAX_BULK_DAYS,
    { future: true },
  );
  const { staffIds, departmentId } = readTargets(body);
  const ctx = await loadContext(hotelId, fromDate, toDate, {
    departmentId: departmentId || undefined,
    staffIds,
  });
  const ids = ctx.staffIds;
  if (!ids.length) return { removed: 0 };

  const result = await ShiftAssignment.deleteMany({
    hotelId,
    staffId: { $in: ids },
    date: { $gte: fromDate, $lte: toDate },
  });
  return { removed: result.deletedCount ?? 0 };
};

const readCoverage = (list, poolIds) => {
  if (list === undefined) return [];
  if (!Array.isArray(list)) throw new ApiError(400, "Coverage must be a list.");
  return list.map((rule) => {
    const min = Number(rule?.min);
    if (!isObjectId(rule?.shiftId) || !poolIds.has(String(rule.shiftId)))
      throw new ApiError(
        400,
        "Each coverage rule needs a shift that is part of this schedule.",
      );
    if (!Number.isInteger(min) || min < 1 || min > 500)
      throw new ApiError(
        400,
        "Coverage minimum must be a whole number from 1 to 500.",
      );
    if (rule.departmentId && !isObjectId(rule.departmentId))
      throw new ApiError(400, "Invalid department in coverage.");
    return {
      shiftId: String(rule.shiftId),
      departmentId: rule.departmentId ? String(rule.departmentId) : null,
      min,
    };
  });
};

export const autoSchedule = async (hotelId, body = {}, actor = null) => {
  const { fromDate, toDate } = readRange(
    body.fromDate,
    body.toDate,
    MAX_AUTO_DAYS,
    { future: true },
  );
  const departmentId = body.departmentId ? String(body.departmentId) : "";
  if (departmentId && !isObjectId(departmentId))
    throw new ApiError(400, "Invalid department.");
  const staffIds = readIds(body.staffIds, "Staff");
  const shiftIds = readIds(body.shiftIds, "Shifts");

  const ctx = await loadContext(hotelId, fromDate, toDate, {
    departmentId: departmentId || undefined,
    staffIds,
  });
  if (!ctx.staff.length) throw new ApiError(404, "No active staff matched.");

  const pool = [...ctx.shifts.values()].filter(
    (shift) =>
      shift.isActive !== false &&
      (!shiftIds.length || shiftIds.includes(sid(shift._id))),
  );
  if (!pool.length)
    throw new ApiError(400, "There is no active shift to schedule with.");
  const poolIds = new Set(pool.map((shift) => sid(shift._id)));
  const coverage = readCoverage(body.coverage, poolIds);

  const offDays =
    body.weeklyOffDays === undefined
      ? weeklyOffDays()
      : readDays(body.weeklyOffDays);
  const rotate = Boolean(body.rotateWeeklyOff);
  const restHours =
    body.minRestHours === undefined
      ? minRestHours()
      : Number(body.minRestHours);
  if (!Number.isFinite(restHours) || restHours < 0 || restHours > 24)
    throw new ApiError(400, "Minimum rest must be 0-24 hours.");

  const ops = new Map();
  const skipped = [];
  const unmet = [];
  const stats = { assigned: 0, daysOff: 0 };

  const setShift = (member, date, shift) => {
    ctx.set(member._id, date, shift ? shift._id : null);
    ops.set(`${sid(member._id)}|${date}`, {
      staffId: member._id,
      date,
      shiftId: shift ? shift._id : null,
    });
  };

  const fits = (member, date, shift) => {
    const check = neighbours(ctx, member._id, date, shift);
    return !check.overlap && !restShort(check.gap, restHours);
  };

  const countOn = (date, scopeDepartment, shiftId) =>
    ctx.staff.filter((member) => {
      if (scopeDepartment && sid(member.departmentId) !== scopeDepartment)
        return false;
      const entry = ctx.cell(member._id, date);
      return entry.shift && sid(entry.shift._id) === shiftId;
    }).length;

  const canLeave = (member, date, shiftId) =>
    coverage.every((rule) => {
      if (rule.shiftId !== shiftId) return true;
      if (rule.departmentId && rule.departmentId !== sid(member.departmentId))
        return true;
      return countOn(date, rule.departmentId, shiftId) - 1 >= rule.min;
    });

  const dates = time.eachDate(fromDate, toDate);
  const defaultOff = new Set(offDays);

  for (const date of dates) {
    const weekday = rules.weekdayOf(date);
    const mine = [];
    ctx.staff.forEach((member, index) => {
      const entry = ctx.cell(member._id, date);
      if (entry.state === "LEAVE" || entry.state === "HOLIDAY") return;
      if (entry.explicit && !body.overwrite) return;

      const offToday = rotate
        ? offDays.length > 0 &&
          offDays.some((_, k) => (index + k) % 7 === weekday)
        : defaultOff.has(weekday);

      if (offToday) {
        setShift(member, date, null);
        stats.daysOff += 1;
        return;
      }

      const preferred =
        pool.find((shift) => sid(shift._id) === sid(member.shiftId)) ||
        pool[index % pool.length];
      const choice = [
        preferred,
        ...pool.filter((shift) => shift !== preferred),
      ].find((shift) => fits(member, date, shift));

      if (!choice) {
        skipped.push({
          staffId: member._id,
          staffName: member.name,
          date,
          reason: "No shift fits the rest rules.",
        });
        return;
      }
      setShift(member, date, choice);
      stats.assigned += 1;
      mine.push(member);
    });

    const closedDay =
      ctx.isClosed(date) || (!rotate && defaultOff.has(weekday));

    for (const rule of closedDay ? [] : coverage) {
      let actual = countOn(date, rule.departmentId, rule.shiftId);
      const target = ctx.shifts.get(rule.shiftId);
      const movers = mine
        .filter(
          (member) =>
            !rule.departmentId ||
            sid(member.departmentId) === rule.departmentId,
        )
        .filter((member) => {
          const current = ctx.cell(member._id, date).shift;
          return (
            current &&
            sid(current._id) !== rule.shiftId &&
            canLeave(member, date, sid(current._id)) &&
            fits(member, date, target)
          );
        })
        .sort(
          (a, b) =>
            Number(sid(b.shiftId) === rule.shiftId) -
            Number(sid(a.shiftId) === rule.shiftId),
        );

      for (const member of movers) {
        if (actual >= rule.min) break;
        const current = ctx.cell(member._id, date).shift;
        if (
          !canLeave(member, date, sid(current._id)) ||
          !fits(member, date, target)
        )
          continue;
        setShift(member, date, target);
        actual += 1;
      }
      if (actual < rule.min) {
        unmet.push({
          date,
          shiftId: rule.shiftId,
          shiftName: target.name,
          departmentId: rule.departmentId,
          required: rule.min,
          actual,
        });
      }
    }
  }

  const list = [...ops.values()];
  if (!body.dryRun && list.length)
    await persist(hotelId, list, { source: "AUTO", actor });

  return {
    dryRun: Boolean(body.dryRun),
    range: { from: fromDate, to: toDate, days: dates.length },
    staffCount: ctx.staff.length,
    shifts: pool.map(shiftMini),
    assigned: [...ops.values()].filter((op) => op.shiftId).length,
    daysOff: stats.daysOff,
    written: list.length,
    skipped: capped(skipped),
    unmetCoverage: capped(unmet),
    preview: body.dryRun
      ? list.slice(0, 50).map((op) => ({
          staffName: ctx.staffById.get(sid(op.staffId))?.name,
          date: op.date,
          shift: op.shiftId ? ctx.shifts.get(sid(op.shiftId))?.name : "Day off",
        }))
      : undefined,
  };
};

export const report = async (hotelId, query = {}) => {
  const today = time.todayKey();
  const { fromDate, toDate } = readRange(
    query.from || `${today.slice(0, 8)}01`,
    query.to || today,
    MAX_REPORT_DAYS,
  );
  if (query.department_id && !isObjectId(query.department_id))
    throw new ApiError(400, "Invalid department.");

  const ctx = await loadContext(hotelId, fromDate, toDate, {
    departmentId: query.department_id,
  });
  const dates = time.eachDate(fromDate, toDate);

  const stats = new Map(
    [...ctx.shifts.keys()].map((id) => [
      id,
      {
        scheduled: 0,
        present: 0,
        late: 0,
        absent: 0,
        onLeave: 0,
        workMinutes: 0,
        worked: 0,
      },
    ]),
  );

  for (const date of dates) {
    for (const member of ctx.staff) {
      const entry = ctx.cell(member._id, date);
      if (entry.state === "SHIFT" && entry.shift)
        stats.get(sid(entry.shift._id)).scheduled += 1;
    }
  }

  const records = ctx.staffIds.length
    ? await AttendanceRecord.find({
        hotelId,
        date: { $gte: fromDate, $lte: toDate },
        staffId: { $in: ctx.staffIds },
      }).lean()
    : [];
  for (const record of records) {
    const row = record.shiftId ? stats.get(sid(record.shiftId)) : null;
    if (!row) continue;
    if (record.status === "PRESENT") row.present += 1;
    else if (record.status === "LATE") row.late += 1;
    else if (record.status === "ABSENT") row.absent += 1;
    else if (record.status === "ON_LEAVE") row.onLeave += 1;
    if (record.checkInAt && record.checkOutAt) {
      row.workMinutes += record.workMinutes || 0;
      row.worked += 1;
    }
  }

  const rows = [...ctx.shifts.values()]
    .map((shift) => {
      const row = stats.get(sid(shift._id));
      const attended = row.present + row.late;
      return {
        shift: shiftView(shift),
        scheduled: row.scheduled,
        present: row.present,
        late: row.late,
        absent: row.absent,
        onLeave: row.onLeave,
        attendanceRate: percentOf(attended, attended + row.absent),
        punctualityRate: percentOf(row.present, attended),
        workMinutes: row.workMinutes,
        workLabel: time.formatMinutes(row.workMinutes),
        avgWorkLabel: row.worked
          ? time.formatMinutes(Math.round(row.workMinutes / row.worked))
          : "-",
      };
    })
    .filter(
      (row) =>
        row.shift.isActive ||
        row.scheduled ||
        row.present ||
        row.late ||
        row.absent,
    );

  const total = (key) => rows.reduce((sum, row) => sum + row[key], 0);
  return {
    from: fromDate,
    to: toDate,
    rows,
    totals: {
      scheduled: total("scheduled"),
      present: total("present"),
      late: total("late"),
      absent: total("absent"),
      onLeave: total("onLeave"),
      workMinutes: total("workMinutes"),
    },
  };
};

export const shiftForAttendance = async (hotelId, staff, dateKey) => {
  const row = await ShiftAssignment.findOne({
    hotelId,
    staffId: staff._id,
    date: dateKey,
  }).lean();
  const shiftId = row?.shiftId || staff.shiftId;
  return shiftId ? StaffShift.findOne({ _id: shiftId, hotelId }).lean() : null;
};
