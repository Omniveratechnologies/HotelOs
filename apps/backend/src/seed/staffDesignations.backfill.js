import "dotenv/config";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { StaffDesignation } from "../modules/staff-management/models/staffDesignation.js";

const hotelIdFromEnv = () => {
  const id = process.env.STAFF_DEFAULT_HOTEL_ID;
  if (!id || !mongoose.isValidObjectId(id)) {
    console.error("Set STAFF_DEFAULT_HOTEL_ID (a valid ObjectId) in .env");
    process.exit(1);
  }
  return id;
};

export const suggestCode = (name = "") => {
  const words = name
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "DSG";
  if (words.length > 1)
    return words
      .map((word) => word[0])
      .join("")
      .slice(0, 6)
      .padEnd(2, "X");
  return words[0].length <= 4 ? words[0].padEnd(2, "X") : words[0].slice(0, 3);
};

export const backfillDesignations = async (hotelId) => {
  const designations = await StaffDesignation.find({ hotelId }).sort({
    name: 1,
    _id: 1,
  });
  const taken = new Set(designations.map((item) => item.code).filter(Boolean));
  let updated = 0;

  for (const designation of designations) {
    if (designation.code) continue;

    const base = suggestCode(designation.name);
    let code = base;
    let suffix = 2;

    while (taken.has(code)) code = `${base.slice(0, 7)}${suffix++}`;

    taken.add(code);
    designation.code = code;
    await designation.save();
    updated += 1;
  }

  return { total: designations.length, updated };
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error("Set MONGODB_URI (or MONGO_URI) in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  await StaffDesignation.syncIndexes();

  const result = await backfillDesignations(
    new mongoose.Types.ObjectId(hotelIdFromEnv()),
  );
  console.log(`Designations: ${result.total}, given a code: ${result.updated}`);

  await mongoose.disconnect();
}
