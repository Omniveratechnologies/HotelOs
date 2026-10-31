import "dotenv/config";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { Staff } from "../modules/staff-management/models/staffManagement.js";
import { LeaveType } from "../modules/leaveManagement/models/leaveType.js";
import { LeaveBalance } from "../modules/leaveManagement/models/leaveBalance.js";
import { LeaveRequest } from "../modules/leaveManagement/models/leaveRequest.js";
import {
  applyLeave,
  approveLeave,
  rejectLeave,
  weeklyOffDays,
} from "../modules/leaveManagement/services/leave.service.js";
import * as time from "../utils/attendanceTime.js";

export const DEFAULT_TYPES = [
  {
    name: "Casual Leave",
    annualQuota: 12,
    isPaid: true,
    color: "#3b82f6",
    minNoticeDays: 1,
    attachmentAfterDays: null,
    sortOrder: 1,
  },
  {
    name: "Sick Leave",
    annualQuota: 10,
    isPaid: true,
    color: "#ef4444",
    minNoticeDays: 0,
    attachmentAfterDays: 2,
    sortOrder: 2,
  },
  {
    name: "Paid Leave",
    annualQuota: 15,
    isPaid: true,
    color: "#10b981",
    minNoticeDays: 3,
    attachmentAfterDays: null,
    sortOrder: 3,
  },
  {
    name: "Unpaid Leave",
    annualQuota: 0,
    isPaid: false,
    color: "#f59e0b",
    minNoticeDays: 1,
    attachmentAfterDays: null,
    sortOrder: 4,
  },
  {
    name: "Maternity Leave",
    annualQuota: 180,
    isPaid: true,
    color: "#ec4899",
    minNoticeDays: 30,
    attachmentAfterDays: 0,
    sortOrder: 5,
  },
];

export const seedLeaveSetup = async (hotelId, now = new Date()) => {
  const year = Number(time.todayKey(time.hotelTimezone(), now).slice(0, 4));
  const result = { types: 0, balances: 0 };

  const types = [];
  for (const spec of DEFAULT_TYPES) {
    let type = await LeaveType.findOne({ hotelId, name: spec.name });
    if (!type) {
      type = await LeaveType.create({ hotelId, ...spec });
      result.types += 1;
    }
    types.push(type);
  }

  const staff = await Staff.find({ hotelId, deletedAt: null, status: "ACTIVE" })
    .select("_id")
    .lean();
  for (const member of staff) {
    for (const type of types) {
      const exists = await LeaveBalance.findOne({
        staffId: member._id,
        leaveTypeId: type._id,
        year,
      });
      if (exists) continue;
      await LeaveBalance.create({
        hotelId,
        staffId: member._id,
        leaveTypeId: type._id,
        year,
        allotted: type.annualQuota,
        used: 0,
      });
      result.balances += 1;
    }
  }

  return result;
};

export const seedDemoRequests = async (hotelId, now = new Date()) => {
  if (await LeaveRequest.exists({ hotelId }))
    return { created: 0, note: "Requests already exist" };

  const types = new Map(
    (await LeaveType.find({ hotelId }).lean()).map((type) => [type.name, type]),
  );
  const staff = await Staff.find({ hotelId, deletedAt: null, status: "ACTIVE" })
    .sort({ staffCode: 1 })
    .limit(12)
    .lean();
  if (staff.length === 0) return { created: 0, note: "No active staff" };

  const today = time.todayKey(time.hotelTimezone(), now);
  const at = (offset) => time.addDays(today, offset);
  const workday = (key) => {
    let day = key;
    while (weeklyOffDays().includes(new Date(`${day}T00:00:00Z`).getUTCDay()))
      day = time.addDays(day, 1);
    return day;
  };
  const plan = [
    ["Casual Leave", 2, 2, "Family function", "APPROVED"],
    ["Sick Leave", -3, -2, "Fever and cold", "APPROVED"],
    ["Paid Leave", 5, 8, "Vacation", "APPROVED"],
    ["Casual Leave", 3, 3, "Personal work", "REJECTED"],
    ["Sick Leave", 1, 2, "Dental treatment", "APPROVED"],
    ["Unpaid Leave", 6, 8, "Visiting hometown", "PENDING"],
    ["Casual Leave", 9, 9, "Bank work", "APPROVED"],
    ["Sick Leave", 4, 4, "Check-up", "PENDING"],
    ["Paid Leave", 12, 14, "Wedding", "APPROVED"],
    ["Maternity Leave", 40, 60, "Maternity", "PENDING"],
    ["Casual Leave", 7, 7, "House shifting", "APPROVED"],
    ["Sick Leave", -1, -1, "Stomach ache", "APPROVED"],
  ];

  let created = 0;
  for (const [index, [typeName, from, to, reason, status]] of plan.entries()) {
    const member = staff[index % staff.length];
    try {
      const request = await applyLeave(
        hotelId,
        {
          staffId: member._id,
          leaveTypeId: types.get(typeName)._id,
          fromDate: workday(at(from)),
          toDate: workday(at(from)) > at(to) ? workday(at(from)) : at(to),
          reason,
          attachmentUrl: "",
        },
        { name: "Seed" },
        { trusted: true, now },
      );
      if (status === "APPROVED")
        await approveLeave(
          hotelId,
          request._id,
          {},
          { name: "HR Manager" },
          now,
        );
      if (status === "REJECTED")
        await rejectLeave(
          hotelId,
          request._id,
          { remarks: "Staff shortage on that day" },
          { name: "HR Manager" },
          now,
        );
      created += 1;
    } catch (error) {
      console.log(`skipped ${typeName} for ${member.name}: ${error.message}`);
    }
  }

  return { created };
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL;
  const hotel = process.env.STAFF_DEFAULT_HOTEL_ID;
  if (!uri || !mongoose.isValidObjectId(hotel)) {
    console.error("Set MONGO_URI and STAFF_DEFAULT_HOTEL_ID in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const hotelId = new mongoose.Types.ObjectId(hotel);

  console.log("Setup:", await seedLeaveSetup(hotelId));
  if (process.argv.includes("--demo"))
    console.log("Demo requests:", await seedDemoRequests(hotelId));

  await mongoose.disconnect();
}
