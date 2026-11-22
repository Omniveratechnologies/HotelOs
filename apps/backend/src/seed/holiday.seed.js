import "dotenv/config";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import {
  createHoliday,
  importHolidays,
  seedNational,
} from "../modules/holiday/services/holiday.service.js";
import * as time from "../utils/attendanceTime.js";
export const demoHolidays = (year) => [
  {
    name: "Holi",
    date: `${year}-03-14`,
    description: "Festival of colors",
    type: "NATIONAL",
  },
  {
    name: "Good Friday",
    date: `${year}-04-03`,
    description: "Christian holiday",
    type: "NATIONAL",
  },
  {
    name: "Dussehra",
    date: `${year}-10-21`,
    description: "Festival",
    type: "NATIONAL",
  },
  {
    name: "Diwali",
    date: `${year}-11-12`,
    description: "Festival of lights",
    type: "NATIONAL",
  },
];

export const seedDemo = async (
  hotelId,
  year = Number(time.todayKey().slice(0, 4)),
) => {
  const imported = await importHolidays(hotelId, {
    holidays: demoHolidays(year),
    type: "NATIONAL",
  });
  const custom = [
    {
      name: "Hotel Anniversary",
      date: `${year}-05-15`,
      description: "Hotel specific holiday",
      type: "CUSTOM",
    },
    {
      name: "Staff Retreat",
      date: `${year + 1}-01-05`,
      description: "Annual staff retreat",
      type: "CUSTOM",
    },
  ];
  let created = imported.created;
  for (const item of custom) {
    try {
      await createHoliday(hotelId, item);
      created += 1;
    } catch (error) {
      if (error.status !== 409) throw error;
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
  const national = await seedNational(hotelId, {});
  console.log(
    `National holidays: ${national.created} added${national.skipped.length ? `, skipped ${national.skipped.join(", ")}` : ""}`,
  );
  if (process.argv.includes("--demo"))
    console.log(`Sample holidays: ${(await seedDemo(hotelId)).created} added`);
  await mongoose.disconnect();
}
