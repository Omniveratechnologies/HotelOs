import "dotenv/config";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { Staff } from "../modules/staff-management/models/staffManagement.js";
import { StaffShift } from "../modules/staff-management/models/staffShift.js";
import { AttendanceRecord } from "../modules/attendance/models/attendanceRecord.js";
import { computeWorkMinutes } from "../modules/attendance/services/attendance.service.js";
import * as time from "../utils/attendanceTime.js";

const pick = (roll) =>
  roll < 0.83
    ? "PRESENT"
    : roll < 0.93
      ? "LATE"
      : roll < 0.98
        ? "ABSENT"
        : "ON_LEAVE";
const minutesAround = (base, spread) =>
  base + Math.round((Math.random() - 0.5) * 2 * spread);

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

  const days =
    Number(
      process.argv.find((arg) => arg.startsWith("--days="))?.split("=")[1],
    ) || 30;
  await mongoose.connect(uri);
  const hotelId = new mongoose.Types.ObjectId(hotel);

  const [staff, shifts] = await Promise.all([
    Staff.find({ hotelId, deletedAt: null, status: "ACTIVE" }).lean(),
    StaffShift.find({ hotelId }).lean(),
  ]);
  const shiftById = new Map(shifts.map((shift) => [String(shift._id), shift]));
  const fallbackShift = { startTime: "09:00", endTime: "18:00" };

  const today = time.todayKey();
  const docs = [];

  for (let back = days; back >= 1; back -= 1) {
    const date = time.addDays(today, -back);
    for (const member of staff) {
      const shift = shiftById.get(String(member.shiftId)) || fallbackShift;
      const { start, end } = time.shiftWindow(date, shift);
      const status = pick(Math.random());
      const base = {
        hotelId,
        staffId: member._id,
        date,
        departmentId: member.departmentId || null,
        designationId: member.designationId || null,
        shiftId: member.shiftId || null,
        status,
      };

      if (status === "ABSENT" || status === "ON_LEAVE") {
        docs.push({ ...base, source: "system", lastEventAt: end });
        continue;
      }

      const checkInAt = new Date(
        start.getTime() +
          (status === "LATE" ? minutesAround(35, 20) : minutesAround(-5, 8)) *
            60000,
      );
      const checkOutAt = new Date(
        end.getTime() + minutesAround(10, 25) * 60000,
      );
      docs.push({
        ...base,
        checkInAt,
        checkOutAt,
        workMinutes: computeWorkMinutes({
          checkInAt,
          checkOutAt,
          breakMinutes: 0,
        }),
        confidence: Number((0.9 + Math.random() * 0.09).toFixed(3)),
        source: "face",
        lastEventAt: checkOutAt,
      });
    }
  }

  let created = 0;
  try {
    const inserted = await AttendanceRecord.insertMany(docs, {
      ordered: false,
    });
    created = inserted.length;
  } catch (error) {
    if (error?.code !== 11000 && !error?.writeErrors) throw error;
    created =
      error.insertedDocs?.length ??
      docs.length - (error.writeErrors?.length || 0);
  }

  console.log({ staff: staff.length, days, created });
  await mongoose.disconnect();
}
