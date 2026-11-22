import "dotenv/config";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { Staff } from "../modules/staff-management/models/staffManagement.js";
import { StaffShift } from "../modules/shift-schedule/models/staffShift.js";

export const SAMPLE_SHIFTS = [
  {
    name: "Morning",
    startTime: "06:00",
    endTime: "14:00",
    color: "#22C55E",
    weight: 42,
  },
  {
    name: "Afternoon",
    startTime: "14:00",
    endTime: "22:00",
    color: "#3B82F6",
    weight: 38,
  },
  {
    name: "Night",
    startTime: "22:00",
    endTime: "06:00",
    color: "#A855F7",
    weight: 32,
  },
  {
    name: "Split",
    startTime: "09:00",
    endTime: "21:00",
    segments: [
      { startTime: "09:00", endTime: "13:00" },
      { startTime: "17:00", endTime: "21:00" },
    ],
    color: "#F59E0B",
    weight: 12,
  },
];

export const seedShifts = async (hotelId) => {
  const result = [];
  for (const [index, sample] of SAMPLE_SHIFTS.entries()) {
    const { weight, ...fields } = sample;
    let shift = await StaffShift.findOne({ hotelId, name: sample.name });
    if (!shift) {
      shift = await StaffShift.create({
        hotelId,
        breakMinutes: 0,
        graceMinutes: 10,
        sortOrder: index + 1,
        isActive: true,
        segments: [],
        ...fields,
      });
    }
    result.push({ shift, weight });
  }
  return result;
};

export const assignDefaultShifts = async (hotelId, seeded) => {
  const staff = await Staff.find({
    hotelId,
    deletedAt: null,
    status: "ACTIVE",
    shiftId: null,
  }).sort({ name: 1 });
  const total = seeded.reduce((sum, item) => sum + item.weight, 0);
  let given = 0;
  for (const [index, member] of staff.entries()) {
    const slot = ((index + 0.5) / staff.length) * total;
    let run = 0;
    const pick =
      seeded.find((item) => (run += item.weight) >= slot) || seeded[0];
    member.shiftId = pick.shift._id;
    await member.save();
    given += 1;
  }
  return given;
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
  const seeded = await seedShifts(hotelId);
  console.log(
    `Shifts ready: ${seeded.map((item) => item.shift.name).join(", ")}`,
  );

  if (process.argv.includes("--assign")) {
    console.log(
      `Default shift given to ${await assignDefaultShifts(hotelId, seeded)} staff.`,
    );
  }
  await mongoose.disconnect();
}
