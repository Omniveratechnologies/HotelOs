import mongoose from "mongoose";
import {
  Staff,
  StaffDepartment,
  StaffDesignation,
} from "../../staff-management/models/staffManagement.js";
import { AttendanceRecord } from "../../attendance/models/attendanceRecord.js";
import { LeaveType } from "../models/leaveType.js";
import { LeaveBalance } from "../models/leaveBalance.js";
import { LeaveRequest, LEAVE_STATUSES } from "../models/leaveRequest.js";
import * as notifications from "./leaveNotifcation.service.js";
import { ApiError, isObjectId } from "../../../utils/http.js";
import * as time from "../../../utils/attendanceTime.js";

const MAX_RANGE_DAYS = 366;
const MAX_LIMIT = 100;
const SORT_KEYS = ["appliedAt", "fromDate", "toDate", "days", "status"];
const DAY_MS = 86400000;

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const toId = (value) => new mongoose.Types.ObjectId(String(value));
const percentOf = (part, total) =>
  total > 0 ? Math.round((part / total) * 100) : 0;

export const weeklyOffDays = () =>
  String(process.env.LEAVE_WEEKLY_OFF_DAYS ?? "0")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => /^[0-6]$/.test(value))
    .map(Number);

const weekdayOf = (key) => new Date(`${key}T00:00:00Z`).getUTCDay();
const diffDays = (from, to) =>
  Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS,
  );
const maxBackdateDays = () =>
  Math.max(0, Number(process.env.LEAVE_MAX_BACKDATE_DAYS ?? 7));

const holidayDates = async (hotelId, from, to, departmentId = null) => {
  const Holiday = mongoose.models.StaffHoliday;
  if (!Holiday) return new Set();
  const rows = await Holiday.find({ hotelId, date: { $gte: from, $lte: to } })
    .select("date appliesToDepartments holidayDuty")
    .lean();
  return new Set(
    rows
      .filter((row) => !row.holidayDuty)
      .filter(
        (row) =>
          !row.appliesToDepartments?.length ||
          (departmentId &&
            row.appliesToDepartments.some(
              (id) => String(id) === String(departmentId),
            )),
      )
      .map((row) => row.date),
  );
};

export const workingDatesOf = async (
  hotelId,
  from,
  to,
  departmentId = null,
) => {
  const off = new Set(weeklyOffDays());
  const holidays = await holidayDates(hotelId, from, to, departmentId);
  return time
    .eachDate(from, to)
    .filter((key) => !off.has(weekdayOf(key)) && !holidays.has(key));
};

const lockedMonth = async (hotelId, from, to) => {
  const Payroll = mongoose.models.PayrollPeriod;
  if (!Payroll) return "";
  const months = [
    ...new Set(time.eachDate(from, to).map((key) => key.slice(0, 7))),
  ];
  const locked = await Payroll.findOne({
    hotelId,
    month: { $in: months },
    status: "LOCKED",
  })
    .select("month")
    .lean();
  return locked?.month || "";
};

const splitByYear = (dates) => {
  const map = new Map();
  for (const key of dates)
    map.set(
      Number(key.slice(0, 4)),
      (map.get(Number(key.slice(0, 4))) || 0) + 1,
    );
  return [...map].map(([year, days]) => ({ year, days }));
};

const ensureBalance = async (hotelId, staffId, type, year) => {
  const key = { staffId, leaveTypeId: type._id, year };
  let balance = await LeaveBalance.findOne(key);
  if (balance) return balance;

  try {
    return await LeaveBalance.create({
      hotelId,
      ...key,
      allotted: type.annualQuota,
      used: 0,
    });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    return LeaveBalance.findOne(key);
  }
};

const pendingDays = async (staffId, typeId, year, excludeId = null) => {
  const rows = await LeaveRequest.find({
    staffId,
    leaveTypeId: typeId,
    status: "PENDING",
  }).lean();
  return rows
    .filter((row) => !excludeId || String(row._id) !== String(excludeId))
    .reduce(
      (sum, row) =>
        sum +
        (row.workingDaysByYear.find((part) => part.year === year)?.days || 0),
      0,
    );
};

const figures = async (hotelId, staffId, type, year, excludeId = null) => {
  const balance = await ensureBalance(hotelId, staffId, type, year);
  const pending = await pendingDays(staffId, type._id, year, excludeId);
  const unlimited = type.annualQuota === 0;
  return {
    year,
    allotted: balance.allotted,
    used: balance.used,
    pending,
    remaining: unlimited
      ? null
      : Math.max(0, balance.allotted - balance.used - pending),
    unlimited,
  };
};

export const staffLeaveBalance = async (
  hotelId,
  staffId,
  query = {},
  now = new Date(),
) => {
  if (!isObjectId(staffId)) throw new ApiError(400, "Invalid staff ID.");
  const staff = await Staff.findOne({ _id: staffId, hotelId, deletedAt: null })
    .select("name staffCode")
    .lean();
  if (!staff) throw new ApiError(404, "Staff member not found.");

  const year =
    Number(query.year) ||
    Number(time.todayKey(time.hotelTimezone(), now).slice(0, 4));
  if (!Number.isInteger(year) || year < 2000 || year > 2100)
    throw new ApiError(400, "year is not valid.");

  const types = await LeaveType.find({ hotelId, active: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean();
  const balances = [];
  for (const type of types) {
    balances.push({
      leaveType: {
        _id: type._id,
        name: type.name,
        color: type.color,
        isPaid: type.isPaid,
      },
      ...(await figures(hotelId, staffId, type, year)),
    });
  }

  return {
    staff: { _id: staff._id, name: staff.name, staffCode: staff.staffCode },
    year,
    balances,
  };
};

const leaveTag = (type) => `Leave: ${type.name}`;

const writeLeaveRows = async (hotelId, request, staff, type, now) => {
  const dates = await workingDatesOf(
    hotelId,
    request.fromDate,
    request.toDate,
    staff?.departmentId,
  );
  const existing = await AttendanceRecord.find({
    staffId: request.staffId,
    date: { $in: dates },
  });
  const byDate = new Map(existing.map((record) => [record.date, record]));

  const result = { created: 0, converted: 0, skipped: 0, conflicts: [] };
  const docs = [];

  for (const date of dates) {
    const record = byDate.get(date);

    if (!record) {
      docs.push({
        hotelId,
        staffId: request.staffId,
        date,
        departmentId: staff.departmentId || null,
        designationId: staff.designationId || null,
        shiftId: staff.shiftId || null,
        status: "ON_LEAVE",
        source: "system",
        remarks: leaveTag(type),
        lastEventAt: now,
      });
    } else if (record.status === "ABSENT") {
      Object.assign(record, {
        status: "ON_LEAVE",
        source: "system",
        remarks: leaveTag(type),
        lastEventAt: now,
      });
      await record.save();
      result.converted += 1;
    } else if (record.status === "ON_LEAVE") {
      result.skipped += 1;
    } else {
      result.conflicts.push(date);
    }
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

  return result;
};

const removeLeaveRows = async (request, type, fromDate) => {
  const result = await AttendanceRecord.deleteMany({
    staffId: request.staffId,
    date: {
      $gte: fromDate > request.fromDate ? fromDate : request.fromDate,
      $lte: request.toDate,
    },
    status: "ON_LEAVE",
    source: "system",
    remarks: leaveTag(type),
  });
  return result.deletedCount ?? 0;
};

const hydrate = async (hotelId, requests) => {
  const unique = (field) =>
    [
      ...new Set(
        requests
          .map((row) => row[field])
          .filter(Boolean)
          .map(String),
      ),
    ].map(toId);

  const [staff, departments, designations, types] = await Promise.all([
    Staff.find({ hotelId, _id: { $in: unique("staffId") } })
      .select("name staffCode photoUrl")
      .lean(),
    StaffDepartment.find({ hotelId, _id: { $in: unique("departmentId") } })
      .select("name color")
      .lean(),
    StaffDesignation.find({ hotelId, _id: { $in: unique("designationId") } })
      .select("name")
      .lean(),
    LeaveType.find({ hotelId, _id: { $in: unique("leaveTypeId") } })
      .select("name color isPaid")
      .lean(),
  ]);

  const index = (rows) => new Map(rows.map((row) => [String(row._id), row]));
  return {
    staff: index(staff),
    departments: index(departments),
    designations: index(designations),
    types: index(types),
  };
};

const toRows = async (hotelId, requests) => {
  const lookup = await hydrate(hotelId, requests);

  return requests.map((request) => {
    const staff = lookup.staff.get(String(request.staffId));
    const department = lookup.departments.get(String(request.departmentId));
    const designation = lookup.designations.get(String(request.designationId));
    const type = lookup.types.get(String(request.leaveTypeId));

    return {
      _id: request._id,
      staff: {
        _id: request.staffId,
        name: staff?.name || "Removed staff",
        staffCode: staff?.staffCode || "",
        photoUrl: staff?.photoUrl || "",
      },
      department: department
        ? {
            _id: department._id,
            name: department.name,
            color: department.color || "",
          }
        : null,
      designation: designation
        ? { _id: designation._id, name: designation.name }
        : null,
      leaveType: type
        ? {
            _id: type._id,
            name: type.name,
            color: type.color,
            isPaid: type.isPaid,
          }
        : {
            _id: request.leaveTypeId,
            name: "Removed type",
            color: "#6b7280",
            isPaid: true,
          },
      fromDate: request.fromDate,
      toDate: request.toDate,
      days: request.days,
      workingDays: request.workingDays,
      reason: request.reason,
      attachmentUrl: request.attachmentUrl || "",
      status: request.status,
      appliedAt: request.appliedAt,
      appliedBy: request.appliedBy || "",
      approver: request.approverName
        ? { _id: request.approverId || null, name: request.approverName }
        : null,
      decidedAt: request.decidedAt || null,
      remarks: request.remarks || "",
    };
  });
};

const rowFor = async (hotelId, request) =>
  (await toRows(hotelId, [request.toObject ? request.toObject() : request]))[0];

const readFilters = (query = {}) => {
  const filters = {
    from: String(query.from ?? "").trim(),
    to: String(query.to ?? "").trim(),
    department_id: String(query.department_id ?? "").trim(),
    leave_type_id: String(query.leave_type_id ?? "").trim(),
    status:
      String(query.status ?? "ALL")
        .trim()
        .toUpperCase() || "ALL",
    q: String(query.q ?? "").trim(),
  };

  if (filters.from && !time.isDateKey(filters.from))
    throw new ApiError(400, "from must be like 2026-10-01.");
  if (filters.to && !time.isDateKey(filters.to))
    throw new ApiError(400, "to must be like 2026-10-31.");
  if (filters.from && filters.to && filters.from > filters.to)
    throw new ApiError(400, "from is after to.");
  if (filters.department_id && !isObjectId(filters.department_id))
    throw new ApiError(400, "Invalid department.");
  if (filters.leave_type_id && !isObjectId(filters.leave_type_id))
    throw new ApiError(400, "Invalid leave type.");
  if (filters.status !== "ALL" && !LEAVE_STATUSES.includes(filters.status))
    throw new ApiError(
      400,
      `status must be ALL or one of ${LEAVE_STATUSES.join(", ")}.`,
    );

  return filters;
};

const buildMatch = async (hotelId, filters, { withStatus = true } = {}) => {
  const match = { hotelId };

  // a leave touches the range when it starts before the range ends and ends after it starts
  if (filters.to) match.fromDate = { $lte: filters.to };
  if (filters.from) match.toDate = { $gte: filters.from };
  if (filters.department_id) match.departmentId = filters.department_id;
  if (filters.leave_type_id) match.leaveTypeId = filters.leave_type_id;

  if (withStatus)
    match.status =
      filters.status === "ALL" ? { $ne: "CANCELLED" } : filters.status; // cancelled ones are hidden unless asked for
  else match.status = { $ne: "CANCELLED" };

  if (filters.q) {
    const pattern = new RegExp(escapeRegex(filters.q), "i");
    const [staff, departments, types] = await Promise.all([
      Staff.find({ hotelId, $or: [{ name: pattern }, { staffCode: pattern }] })
        .select("_id")
        .lean(),
      StaffDepartment.find({ hotelId, name: pattern }).select("_id").lean(),
      LeaveType.find({ hotelId, name: pattern }).select("_id").lean(),
    ]);
    match.$or = [
      { staffId: { $in: staff.map((row) => row._id) } },
      { departmentId: { $in: departments.map((row) => row._id) } },
      { leaveTypeId: { $in: types.map((row) => row._id) } },
    ];
  }

  return match;
};

export const listLeaves = async (hotelId, query = {}) => {
  const match = await buildMatch(hotelId, readFilters(query));

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || 10));
  const key = SORT_KEYS.includes(query.sort) ? query.sort : "appliedAt";
  const sign = String(query.direction).toLowerCase() === "asc" ? 1 : -1;

  const [rows, total] = await Promise.all([
    LeaveRequest.find(match)
      .sort({ [key]: sign, _id: sign })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    LeaveRequest.countDocuments(match),
  ]);

  return {
    rows: await toRows(hotelId, rows),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

export const leaveStats = async (hotelId, query = {}) => {
  const base = await buildMatch(hotelId, readFilters(query), {
    withStatus: false,
  });
  const count = (status) => LeaveRequest.countDocuments({ ...base, status });

  const [approved, pending, rejected] = await Promise.all([
    count("APPROVED"),
    count("PENDING"),
    count("REJECTED"),
  ]);
  const total = approved + pending + rejected;

  return {
    total,
    approved,
    pending,
    rejected,
    percent: {
      approved: percentOf(approved, total),
      pending: percentOf(pending, total),
      rejected: percentOf(rejected, total),
    },
  };
};

export const listLeaveTypes = async (hotelId) =>
  LeaveType.find({ hotelId, active: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

const findRequest = async (hotelId, id) => {
  if (!isObjectId(id)) throw new ApiError(400, "Invalid leave request ID.");
  const request = await LeaveRequest.findOne({ _id: id, hotelId });
  if (!request) throw new ApiError(404, "Leave request not found.");
  return request;
};

export const getLeave = async (hotelId, id) => {
  const request = await findRequest(hotelId, id);
  const type = await LeaveType.findOne({ _id: request.leaveTypeId, hotelId });

  return {
    ...(await rowFor(hotelId, request)),
    balance: type
      ? await figures(
          hotelId,
          request.staffId,
          type,
          Number(request.fromDate.slice(0, 4)),
          request._id,
        )
      : null,
  };
};

const readApplication = (body = {}) => {
  const value = {
    staffId: String(body.staffId ?? "").trim(),
    leaveTypeId: String(body.leaveTypeId ?? "").trim(),
    fromDate: String(body.fromDate ?? "").trim(),
    toDate: String(body.toDate ?? body.fromDate ?? "").trim(),
    reason: String(body.reason ?? "")
      .trim()
      .replace(/\s+/g, " "),
    attachmentUrl: String(body.attachmentUrl ?? "").trim(),
  };

  if (!isObjectId(value.staffId))
    throw new ApiError(400, "Choose a staff member.");
  if (!isObjectId(value.leaveTypeId))
    throw new ApiError(400, "Choose a leave type.");
  if (!time.isDateKey(value.fromDate) || !time.isDateKey(value.toDate))
    throw new ApiError(400, "Choose valid From and To dates.");
  if (value.fromDate > value.toDate)
    throw new ApiError(400, "The To date is before the From date.");
  if (value.reason.length < 3 || value.reason.length > 500)
    throw new ApiError(400, "Reason must be 3-500 characters.");
  if (
    value.attachmentUrl &&
    !(
      /^https?:\/\//i.test(value.attachmentUrl) ||
      value.attachmentUrl.startsWith("/")
    )
  ) {
    throw new ApiError(400, "Attachment must be a link (https://...).");
  }
  if (value.attachmentUrl.length > 500)
    throw new ApiError(400, "Attachment link is too long.");

  return value;
};

const activeOverlap = (staffId, from, to, excludeId = null) =>
  LeaveRequest.find({
    staffId,
    status: { $in: ["PENDING", "APPROVED"] },
    fromDate: { $lte: to },
    toDate: { $gte: from },
  })
    .lean()
    .then((rows) =>
      rows.filter((row) => !excludeId || String(row._id) !== String(excludeId)),
    );

export const applyLeave = async (
  hotelId,
  body = {},
  actor = {},
  { trusted = false, now = new Date() } = {},
) => {
  const input = readApplication(body);

  const [staff, type] = await Promise.all([
    Staff.findOne({
      _id: input.staffId,
      hotelId,
      deletedAt: null,
      status: "ACTIVE",
    }),
    LeaveType.findOne({ _id: input.leaveTypeId, hotelId, active: true }),
  ]);
  if (!staff) throw new ApiError(404, "Staff member not found or not active.");
  if (!type) throw new ApiError(404, "Leave type not found.");

  const days = diffDays(input.fromDate, input.toDate) + 1;
  if (days > MAX_RANGE_DAYS)
    throw new ApiError(400, `A leave can be at most ${MAX_RANGE_DAYS} days.`);

  const today = time.todayKey(time.hotelTimezone(), now);
  if (!trusted) {
    const ahead = diffDays(today, input.fromDate);
    if (type.minNoticeDays > 0 && ahead < type.minNoticeDays) {
      throw new ApiError(
        400,
        `${type.name} needs ${type.minNoticeDays} day${type.minNoticeDays === 1 ? "" : "s"} notice.`,
      );
    }
    if (type.minNoticeDays === 0 && ahead < -maxBackdateDays()) {
      throw new ApiError(
        400,
        `${type.name} cannot be applied for more than ${maxBackdateDays()} days back.`,
      );
    }
  }

  const locked = await lockedMonth(hotelId, input.fromDate, input.toDate);
  if (locked)
    throw new ApiError(
      409,
      `Payroll for ${locked} is locked, so leave cannot be applied for those dates.`,
    );

  const workingDates = await workingDatesOf(
    hotelId,
    input.fromDate,
    input.toDate,
    staff.departmentId,
  );
  if (workingDates.length === 0)
    throw new ApiError(400, "Every selected day is a weekly off or a holiday.");

  if (
    !trusted &&
    type.attachmentAfterDays !== null &&
    days > type.attachmentAfterDays &&
    !input.attachmentUrl
  ) {
    throw new ApiError(
      400,
      `${type.name} longer than ${type.attachmentAfterDays} day${type.attachmentAfterDays === 1 ? "" : "s"} needs an attachment (medical certificate).`,
    );
  }

  const clash = await activeOverlap(staff._id, input.fromDate, input.toDate);
  if (clash.length > 0) {
    throw new ApiError(
      409,
      `This overlaps with another leave (${clash[0].fromDate} to ${clash[0].toDate}, ${clash[0].status.toLowerCase()}).`,
    );
  }

  const byYear = splitByYear(workingDates);
  if (type.annualQuota > 0) {
    for (const part of byYear) {
      const balance = await figures(hotelId, staff._id, type, part.year);
      if (part.days > balance.remaining) {
        throw new ApiError(
          400,
          `Not enough ${type.name} balance for ${part.year}: ${balance.remaining} day${balance.remaining === 1 ? "" : "s"} available, ${part.days} asked.`,
        );
      }
    }
  }

  const request = await LeaveRequest.create({
    hotelId,
    staffId: staff._id,
    departmentId: staff.departmentId || null,
    designationId: staff.designationId || null,
    leaveTypeId: type._id,
    fromDate: input.fromDate,
    toDate: input.toDate,
    days,
    workingDays: workingDates.length,
    workingDaysByYear: byYear,
    reason: input.reason,
    attachmentUrl: input.attachmentUrl,
    status: "PENDING",
    appliedAt: now,
    appliedBy: actor.name || "",
  });

  const twins = (
    await activeOverlap(staff._id, input.fromDate, input.toDate, request._id)
  ).filter((row) => String(row._id) < String(request._id));
  if (twins.length > 0) {
    await request.deleteOne();
    throw new ApiError(409, "This leave was just applied. Refresh the list.");
  }

  await quietly(() =>
    notifications.leaveApplied({ hotelId, request, staff, type }),
  );
  return rowFor(hotelId, request);
};

const quietly = async (task) => {
  try {
    await task();
  } catch (error) {
    console.error("Leave notification failed:", error?.message || error);
  }
};

const actorFields = (actor = {}) => ({
  approverId: actor.userId || null,
  approverName: actor.name || "",
});

const claim = async (hotelId, id, status, actor, remarks, now) => {
  const claimed = await LeaveRequest.findOneAndUpdate(
    { _id: id, hotelId, status: "PENDING" },
    { $set: { status, ...actorFields(actor), decidedAt: now, remarks } },
    { new: true },
  );
  if (!claimed) throw new ApiError(409, "This request was already decided.");
  return claimed;
};

const readRemarks = (body = {}, { required = false } = {}) => {
  const remarks = String(body.remarks ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (required && remarks.length < 3)
    throw new ApiError(
      400,
      "Please write the reason for rejecting (at least 3 characters).",
    );
  if (remarks.length > 300)
    throw new ApiError(400, "Remarks can be at most 300 characters.");
  return remarks;
};

const loadContext = async (hotelId, request) => {
  const [staff, type] = await Promise.all([
    Staff.findOne({ _id: request.staffId, hotelId }),
    LeaveType.findOne({ _id: request.leaveTypeId, hotelId }),
  ]);
  if (!staff || !type)
    throw new ApiError(
      409,
      "The staff member or leave type of this request no longer exists.",
    );
  return { staff, type };
};

export const approveLeave = async (
  hotelId,
  id,
  body = {},
  actor = {},
  now = new Date(),
) => {
  const request = await findRequest(hotelId, id);
  if (request.status !== "PENDING")
    throw new ApiError(
      409,
      `This request is already ${request.status.toLowerCase()}.`,
    );

  const remarks = readRemarks(body);
  const { staff, type } = await loadContext(hotelId, request);

  const locked = await lockedMonth(hotelId, request.fromDate, request.toDate);
  if (locked) throw new ApiError(409, `Payroll for ${locked} is locked.`);

  const claimed = await claim(
    hotelId,
    request._id,
    "APPROVED",
    actor,
    remarks,
    now,
  );

  const taken = [];
  try {
    for (const part of claimed.workingDaysByYear) {
      const balance = await ensureBalance(hotelId, staff._id, type, part.year);
      const where =
        type.annualQuota > 0
          ? { _id: balance._id, used: { $lte: balance.allotted - part.days } }
          : { _id: balance._id };
      const updated = await LeaveBalance.findOneAndUpdate(
        where,
        { $inc: { used: part.days } },
        { new: true },
      );
      if (!updated)
        throw new ApiError(
          409,
          `Not enough ${type.name} balance left for ${part.year}.`,
        );
      taken.push(part);
    }
  } catch (error) {
    for (const part of taken) {
      const balance = await ensureBalance(hotelId, staff._id, type, part.year);
      await LeaveBalance.findOneAndUpdate(
        { _id: balance._id },
        { $inc: { used: -part.days } },
      );
    }
    await LeaveRequest.findOneAndUpdate(
      { _id: request._id },
      {
        $set: {
          status: "PENDING",
          approverId: null,
          approverName: "",
          decidedAt: null,
          remarks: request.remarks || "",
        },
      },
    );
    throw error;
  }

  const attendance = await writeLeaveRows(hotelId, claimed, staff, type, now);
  await quietly(() =>
    notifications.leaveDecided({ hotelId, request: claimed, staff, type }),
  );

  return { ...(await rowFor(hotelId, claimed)), attendance };
};

export const rejectLeave = async (
  hotelId,
  id,
  body = {},
  actor = {},
  now = new Date(),
) => {
  const request = await findRequest(hotelId, id);
  if (request.status !== "PENDING")
    throw new ApiError(
      409,
      `This request is already ${request.status.toLowerCase()}.`,
    );

  const remarks = readRemarks(body, { required: true });
  const { staff, type } = await loadContext(hotelId, request);
  const claimed = await claim(
    hotelId,
    request._id,
    "REJECTED",
    actor,
    remarks,
    now,
  );

  await quietly(() =>
    notifications.leaveDecided({ hotelId, request: claimed, staff, type }),
  );
  return rowFor(hotelId, claimed);
};

export const cancelLeave = async (
  hotelId,
  id,
  body = {},
  actor = {},
  now = new Date(),
) => {
  const request = await findRequest(hotelId, id);
  if (!["PENDING", "APPROVED"].includes(request.status))
    throw new ApiError(
      409,
      `A ${request.status.toLowerCase()} request cannot be cancelled.`,
    );

  const remarks = readRemarks(body);
  const { staff, type } = await loadContext(hotelId, request);
  const wasApproved = request.status === "APPROVED";

  if (wasApproved) {
    const today = time.todayKey(time.hotelTimezone(), now);
    if (request.fromDate < today)
      throw new ApiError(
        400,
        "This leave has already started. Ask HR to correct the attendance instead.",
      );
    const locked = await lockedMonth(hotelId, request.fromDate, request.toDate);
    if (locked) throw new ApiError(409, `Payroll for ${locked} is locked.`);
  }

  const claimed = await LeaveRequest.findOneAndUpdate(
    { _id: request._id, hotelId, status: request.status },
    {
      $set: {
        status: "CANCELLED",
        ...actorFields(actor),
        decidedAt: now,
        remarks,
      },
    },
    { new: true },
  );
  if (!claimed)
    throw new ApiError(409, "This request just changed. Refresh the list.");

  if (wasApproved) {
    for (const part of claimed.workingDaysByYear) {
      const balance = await ensureBalance(hotelId, staff._id, type, part.year);
      await LeaveBalance.findOneAndUpdate(
        { _id: balance._id },
        { $inc: { used: -part.days } },
      );
    }
    await removeLeaveRows(claimed, type, claimed.fromDate);
  }

  await quietly(() =>
    notifications.leaveDecided({ hotelId, request: claimed, staff, type }),
  );
  return rowFor(hotelId, claimed);
};
