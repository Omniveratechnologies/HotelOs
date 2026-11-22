import "dotenv/config";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { closeDay } from "../modules/attendance/services/attendance.service.js";
import * as time from "../utils/attendanceTime.js";

const hotelIdFromEnv = () => {
  const id = process.env.STAFF_DEFAULT_HOTEL_ID;
  if (!id || !mongoose.isValidObjectId(id)) {
    console.error("Set STAFF_DEFAULT_HOTEL_ID (a valid ObjectId) in .env");
    process.exit(1);
  }
  return new mongoose.Types.ObjectId(id);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL;
  if (!uri) {
    console.error("Set MONGO_URI (or MONGODB_URI) in .env");
    process.exit(1);
  }

  const dateArg = process.argv
    .slice(2)
    .find((arg) => /^\d{4}-\d{2}-\d{2}$/.test(arg));
  const daysArg = process.argv.find((arg) => arg.startsWith("--days="));
  const yesterday = time.addDays(time.todayKey(), -1);

  const dates = dateArg
    ? [dateArg]
    : time.eachDate(
        time.addDays(yesterday, -((Number(daysArg?.split("=")[1]) || 1) - 1)),
        yesterday,
      );

  await mongoose.connect(uri);
  const hotelId = hotelIdFromEnv();

  for (const date of dates) {
    console.log(await closeDay(hotelId, date));
  }

  await mongoose.disconnect();
}
