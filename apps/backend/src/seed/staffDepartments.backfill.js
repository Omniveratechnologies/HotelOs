import "dotenv/config";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { StaffDepartment } from "../modules/staff-management/models/staffManagement.js";

const hotelIdFromEnv = () => {
  const id = process.env.STAFF_DEFAULT_HOTEL_ID;
  if (!id || !mongoose.isValidObjectId(id)) {
    console.error("Set STAFF_DEFAULT_HOTEL_ID (a valid ObjectId) in .env");
    process.exit(1);
  }
  return id;
};

const KNOWN = {
  "front office": { code: "FO", icon: "building", color: "#3b82f6" },
  reception: { code: "RC", icon: "bell", color: "#6366f1" },
  housekeeping: { code: "HK", icon: "sparkles", color: "#f59e0b" },
  kitchen: { code: "KT", icon: "utensils", color: "#ef4444" },
  restaurant: { code: "RS", icon: "wine", color: "#8b5cf6" },
  security: { code: "SC", icon: "shield", color: "#10b981" },
  maintenance: { code: "MT", icon: "wrench", color: "#0ea5e9" },
  accounts: { code: "AC", icon: "wallet", color: "#eab308" },
  hr: { code: "HR", icon: "users", color: "#ec4899" },
  management: { code: "MG", icon: "megaphone", color: "#f97316" },
  others: { code: "OT", icon: "layers", color: "#64748b" },
  it: { code: "IT", icon: "monitor", color: "#14b8a6" },
};

const DESIGN_SET = [
  "Front Office",
  "Housekeeping",
  "Kitchen",
  "Restaurant",
  "Security",
  "Maintenance",
  "Accounts",
  "HR",
  "Management",
  "Others",
];

const initials = (name) => {
  const words = name
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  const letters =
    words.length > 1
      ? words.map((word) => word[0]).join("")
      : (words[0] || "DP").slice(0, 2);
  return letters.slice(0, 4).padEnd(2, "X");
};

export const backfillDepartments = async (
  hotelId,
  { addMissing = false } = {},
) => {
  if (addMissing) {
    for (const name of DESIGN_SET) {
      await StaffDepartment.updateOne(
        { hotelId, name },
        { $setOnInsert: { hotelId, name, isActive: true } },
        { upsert: true, collation: { locale: "en", strength: 2 } },
      );
    }
  }

  const departments = await StaffDepartment.find({ hotelId }).sort({ name: 1 });
  const taken = new Set(departments.map((item) => item.code).filter(Boolean));
  let updated = 0;

  for (const department of departments) {
    if (department.code) continue;

    const known = KNOWN[department.name.trim().toLowerCase()];
    let code = known?.code || initials(department.name);

    let suffix = 2;
    const base = code;
    while (taken.has(code)) code = `${base.slice(0, 5)}${suffix++}`;

    taken.add(code);
    department.code = code;
    department.icon = department.icon || known?.icon || "building";
    department.color = department.color || known?.color || "#3b82f6";
    await department.save();
    updated += 1;
  }

  return { total: departments.length, updated };
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

  await mongoose.connect(uri);
  await StaffDepartment.syncIndexes();

  const result = await backfillDepartments(
    new mongoose.Types.ObjectId(hotelIdFromEnv()),
    {
      addMissing: process.argv.includes("--add-missing"),
    },
  );

  console.log(
    `Departments: ${result.total}, given a code/icon/colour: ${result.updated}`,
  );
  await mongoose.disconnect();
}
