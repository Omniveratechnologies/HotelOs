import "dotenv/config";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { defaultHotelId } from "../modules/staff-management/utils/defaultHotel.js";
import {
  Staff,
  StaffDepartment,
  StaffDesignation,
  FaceEmbedding,
  StaffCounter,
  StaffImportJob,
} from "../modules/staff-management/models/staffManagement.js";
import { StaffShift } from "../modules/staff-management/models/staffShift.js";
import { encrypt } from "../modules/staff-management/utils/crypto.js";
import {
  numberFromCode,
  setStaffCounter,
} from "../modules/staff-management/services/staffCode.service.js";

const DAY = 24 * 60 * 60 * 1000;

const DEPARTMENTS = [
  { name: "Front Office" },
  { name: "Reception" },
  { name: "Housekeeping" },
  { name: "Kitchen" },
  { name: "Security" },
  { name: "Restaurant" },
  { name: "Maintenance" },
  { name: "Accounts" },
  { name: "IT" },
  { name: "HR" },
];

const DESIGNATIONS = {
  "Front Office": ["Receptionist", "Front Office Executive", "Bell Captain"],
  Reception: ["Front Desk Executive", "Guest Relations Executive"],
  Housekeeping: [
    "Housekeeping Staff",
    "Housekeeping Supervisor",
    "Laundry Attendant",
  ],
  Kitchen: ["Chef", "Sous Chef", "Kitchen Assistant"],
  Security: ["Security Guard", "Security Supervisor"],
  Restaurant: ["Waitress", "Waiter", "Restaurant Supervisor"],
  Maintenance: ["Technician", "Electrician", "Maintenance Supervisor"],
  Accounts: ["Accountant", "Accounts Executive"],
  IT: ["IT Support", "System Administrator"],
  HR: ["HR Executive", "HR Manager"],
};

const REFERENCE = [
  {
    name: "Rahul Kumar",
    code: "STF-1024",
    dept: "Front Office",
    desig: "Receptionist",
    phone: "9876543210",
    joined: "2024-01-12",
    status: "ACTIVE",
    face: true,
    gender: "men",
  },
  {
    name: "Priya Singh",
    code: "STF-1032",
    dept: "Reception",
    desig: "Front Desk Executive",
    phone: "9876543211",
    joined: "2024-02-15",
    status: "ACTIVE",
    face: true,
    gender: "women",
  },
  {
    name: "Amit Das",
    code: "STF-1041",
    dept: "Housekeeping",
    desig: "Housekeeping Staff",
    phone: "9876543212",
    joined: "2024-03-01",
    status: "ACTIVE",
    face: true,
    gender: "men",
  },
  {
    name: "Neha Kapoor",
    code: "STF-1038",
    dept: "Kitchen",
    desig: "Chef",
    phone: "9876543213",
    joined: "2024-03-20",
    status: "ACTIVE",
    face: true,
    gender: "women",
  },
  {
    name: "Vikram Singh",
    code: "STF-1007",
    dept: "Security",
    desig: "Security Guard",
    phone: "9876543214",
    joined: "2024-04-05",
    status: "ACTIVE",
    face: false,
    gender: "men",
  },
  {
    name: "Anjali Mehta",
    code: "STF-1062",
    dept: "Restaurant",
    desig: "Waitress",
    phone: "9876543215",
    joined: "2024-04-12",
    status: "ACTIVE",
    face: true,
    gender: "women",
  },
  {
    name: "Rohit Verma",
    code: "STF-1073",
    dept: "Maintenance",
    desig: "Technician",
    phone: "9876543216",
    joined: "2024-04-28",
    status: "ACTIVE",
    face: true,
    gender: "men",
  },
  {
    name: "Sneha Patel",
    code: "STF-1081",
    dept: "Accounts",
    desig: "Accountant",
    phone: "9876543217",
    joined: "2024-05-10",
    status: "ACTIVE",
    face: false,
    gender: "women",
  },
  {
    name: "Pawan Yadav",
    code: "STF-1095",
    dept: "IT",
    desig: "IT Support",
    phone: "9876543218",
    joined: "2024-05-18",
    status: "INACTIVE",
    face: true,
    gender: "men",
  },
  {
    name: "Kavya Nair",
    code: "STF-1102",
    dept: "HR",
    desig: "HR Executive",
    phone: "9876543219",
    joined: "2024-05-25",
    status: "ACTIVE",
    face: true,
    gender: "women",
  },
];

const MALE_NAMES = [
  "Arjun",
  "Karthik",
  "Suresh",
  "Manoj",
  "Deepak",
  "Sanjay",
  "Ravi",
  "Anil",
  "Vijay",
  "Naveen",
  "Prakash",
  "Harish",
  "Gopal",
  "Sunil",
  "Ramesh",
  "Imran",
  "Dinesh",
  "Mohan",
];
const FEMALE_NAMES = [
  "Divya",
  "Meena",
  "Lakshmi",
  "Pooja",
  "Swati",
  "Nisha",
  "Revathi",
  "Sunita",
  "Radha",
  "Geeta",
  "Deepa",
  "Anitha",
  "Shalini",
  "Rekha",
  "Latha",
  "Fatima",
  "Bhavani",
  "Charu",
];
const LAST_NAMES = [
  "Kumar",
  "Singh",
  "Das",
  "Kapoor",
  "Mehta",
  "Verma",
  "Patel",
  "Yadav",
  "Nair",
  "Iyer",
  "Reddy",
  "Sharma",
  "Gupta",
  "Menon",
  "Pillai",
  "Rao",
  "Joshi",
  "Chopra",
  "Naidu",
  "Krishnan",
];
const CITIES = [
  "Coimbatore",
  "Chennai",
  "Madurai",
  "Salem",
  "Erode",
  "Tiruppur",
  "Trichy",
  "Bengaluru",
];

const DEPARTMENT_WEIGHTS = [
  ["Front Office", 12],
  ["Reception", 8],
  ["Housekeeping", 24],
  ["Kitchen", 18],
  ["Security", 12],
  ["Restaurant", 16],
  ["Maintenance", 10],
  ["Accounts", 5],
  ["IT", 4],
  ["HR", 5],
];

const mulberry32 = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const buildSeedData = (now = new Date()) => {
  const rand = mulberry32(20261011);
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const randInt = (min, max) => min + Math.floor(rand() * (max - min + 1));
  const pickWeighted = () => {
    const total = DEPARTMENT_WEIGHTS.reduce(
      (sum, [, weight]) => sum + weight,
      0,
    );
    let roll = rand() * total;
    for (const [name, weight] of DEPARTMENT_WEIGHTS) {
      roll -= weight;
      if (roll <= 0) return name;
    }
    return DEPARTMENT_WEIGHTS[0][0];
  };

  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const monthStart = Date.UTC(year, month, 1);

  const usedCodes = new Set(REFERENCE.map((item) => item.code));
  const usedPhones = new Set(REFERENCE.map((item) => item.phone));
  let codeCursor = 1001;

  const nextCode = () => {
    while (usedCodes.has(`STF-${codeCursor}`)) codeCursor += 1;
    const code = `STF-${codeCursor}`;
    usedCodes.add(code);
    codeCursor += 1;
    return code;
  };

  const nextPhone = () => {
    let phone;
    do {
      phone = `${pick(["9", "8", "7", "6"])}${String(randInt(0, 999999999)).padStart(9, "0")}`;
    } while (usedPhones.has(phone));
    usedPhones.add(phone);
    return phone;
  };

  const dayStart = (timestamp) => {
    const date = new Date(timestamp);
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  };

  const person = ({
    name,
    code,
    dept,
    desig,
    phone,
    joined,
    status,
    face,
    gender,
    deletedAt = null,
  }) => {
    const [first, ...rest] = name.split(" ");
    return {
      staffCode: code,
      name,
      phone,
      email:
        `${first}.${rest.join("").replace(/\s+/g, "")}.${code.slice(4)}@grandview.example`.toLowerCase(),
      dob: new Date(
        Date.UTC(randInt(1975, 2003), randInt(0, 11), randInt(1, 28)),
      ),
      address: `${randInt(1, 120)}, ${pick(["Gandhi Nagar", "Race Course Road", "RS Puram", "Anna Salai", "MG Road"])}, ${pick(CITIES)}`,
      govIdType: "AADHAAR",
      govId: String(randInt(100000000000, 999999999999)),
      department: dept,
      designation: desig,
      employmentType: pick([
        "FULL_TIME",
        "FULL_TIME",
        "FULL_TIME",
        "PART_TIME",
        "CONTRACT",
      ]),
      status,
      joinedOn: joined,
      photoUrl: `https://randomuser.me/api/portraits/${gender}/${randInt(1, 99)}.jpg`,
      face_registered: face,
      deletedAt: deletedAt,
    };
  };

  const staff = REFERENCE.map((item) =>
    person({ ...item, joined: new Date(`${item.joined}T00:00:00.000Z`) }),
  );

  const earliest = Date.UTC(2024, 5, 1);
  const latest = monthStart - DAY;

  const generate = (index, { deleted = false } = {}) => {
    const gender = rand() < 0.5 ? "men" : "women";
    const first = pick(gender === "men" ? MALE_NAMES : FEMALE_NAMES);
    const dept = pickWeighted();

    let desig = pick(DESIGNATIONS[dept]);
    if (dept === "Restaurant" && desig !== "Restaurant Supervisor") {
      desig = gender === "women" ? "Waitress" : "Waiter";
    }

    const isNew = !deleted && index < 12;
    const joined = isNew
      ? new Date(Date.UTC(year, month, randInt(1, now.getUTCDate())))
      : dayStart(earliest + rand() * (latest - earliest));

    return person({
      name: `${first} ${pick(LAST_NAMES)}`,
      code: nextCode(),
      dept,
      desig,
      phone: nextPhone(),
      joined,
      status: deleted || (index >= 12 && index <= 22) ? "INACTIVE" : "ACTIVE",
      face: deleted ? false : rand() > 0.1,
      gender,
      deletedAt: deleted ? now : null,
    });
  };

  for (let index = 0; index < 114; index += 1) staff.push(generate(index));
  for (let index = 0; index < 4; index += 1)
    staff.push(generate(index, { deleted: true }));

  return {
    departments: DEPARTMENTS,
    designations: Object.entries(DESIGNATIONS).flatMap(([department, names]) =>
      names.map((name) => ({ name, department })),
    ),
    staff,
    random: rand,
  };
};

const fakeEmbedding = (rand) =>
  Array.from({ length: 128 }, () => Number((rand() * 2 - 1).toFixed(5)));

const main = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const hotelValue = defaultHotelId();
  if (!uri) throw new Error("Set MONGODB_URI or MONGO_URI.");
  if (!hotelValue || !mongoose.isValidObjectId(hotelValue)) {
    throw new Error("STAFF_DEFAULT_HOTEL_ID is not a valid ObjectId.");
  }

  const hotelId = new mongoose.Types.ObjectId(hotelValue);
  await mongoose.connect(uri);

  const fresh = process.argv.includes("--fresh");
  const existing = await Staff.countDocuments({ hotelId });

  if (existing > 0 && !fresh) {
    console.log(
      "Staff already seeded for this hotel. Run with --fresh to wipe and reseed.",
    );
    return;
  }

  if (fresh) {
    await Promise.all([
      Staff.deleteMany({ hotelId }),
      FaceEmbedding.deleteMany({ hotelId }),
      StaffCounter.deleteMany({ hotelId }),
      StaffImportJob.deleteMany({ hotelId }),
    ]);
  }

  await Promise.all([
    Staff.init(),
    StaffDepartment.init(),
    StaffDesignation.init(),
    StaffShift.init(),
  ]);

  const data = buildSeedData();

  const departmentByName = new Map();
  for (const { name } of data.departments) {
    departmentByName.set(
      name,
      await StaffDepartment.findOneAndUpdate(
        { hotelId, name },
        { $setOnInsert: { hotelId, name, isActive: true } },
        { upsert: true, new: true },
      ),
    );
  }

  const designationByKey = new Map();
  for (const { name, department } of data.designations) {
    const departmentId = departmentByName.get(department)._id;
    designationByKey.set(
      `${department}:${name}`,
      await StaffDesignation.findOneAndUpdate(
        { hotelId, departmentId, name },
        { $setOnInsert: { hotelId, departmentId, name, isActive: true } },
        { upsert: true, new: true },
      ),
    );
  }

  const SHIFTS = [
    { name: "Morning", startTime: "06:00", endTime: "14:00" },
    { name: "Evening", startTime: "14:00", endTime: "22:00" },
    { name: "Night", startTime: "22:00", endTime: "06:00" },
  ];
  const shiftDocs = [];
  for (const shift of SHIFTS) {
    shiftDocs.push(
      await StaffShift.findOneAndUpdate(
        { hotelId, name: shift.name },
        { $setOnInsert: { hotelId, ...shift, isActive: true } },
        { upsert: true, new: true },
      ),
    );
  }

  const inserted = await Staff.insertMany(
    data.staff.map((item, index) => ({
      hotelId,
      shiftId: shiftDocs[index % shiftDocs.length]._id,
      staffCode: item.staffCode,
      name: item.name,
      phone: item.phone,
      email: item.email,
      dob: item.dob,
      address: item.address,
      govIdType: item.govIdType,
      govIdEnc: encrypt(item.govId),
      departmentId: departmentByName.get(item.department)._id,
      designationId: designationByKey.get(
        `${item.department}:${item.designation}`,
      )._id,
      employmentType: item.employmentType,
      status: item.status,
      joinedOn: item.joinedOn,
      photoUrl: item.photoUrl,
      deletedAt: item.deletedAt,
    })),
  );

  const faces = [];
  inserted.forEach((doc, index) => {
    if (data.staff[index].face_registered) {
      faces.push({
        hotelId,
        staffId: doc._id,
        embeddingRef: `seed/faces/${doc.staffCode}.bin`,
      });
    }
  });
  await FaceEmbedding.insertMany(faces);

  const managerOps = [];
  for (const department of departmentByName.values()) {
    const members = inserted
      .filter(
        (doc, index) =>
          !data.staff[index].deletedAt &&
          String(doc.departmentId) === String(department._id),
      )
      .sort((a, b) => a.joinedOn - b.joinedOn);

    if (members.length > 1) {
      managerOps.push({
        updateMany: {
          filter: { _id: { $in: members.slice(1).map((doc) => doc._id) } },
          update: { $set: { managerId: members[0]._id } },
        },
      });
    }
  }
  if (managerOps.length > 0) await Staff.bulkWrite(managerOps);

  await setStaffCounter(
    hotelId,
    Math.max(...data.staff.map((item) => numberFromCode(item.staffCode))),
  );

  const live = data.staff.filter((item) => !item.deletedAt);
  console.log(`Departments:  ${departmentByName.size}`);
  console.log(`Designations: ${designationByKey.size}`);
  console.log(
    `Staff:        ${live.length} live (${live.filter((s) => s.status === "ACTIVE").length} active, ` +
      `${live.filter((s) => s.status === "INACTIVE").length} inactive) + ${data.staff.length - live.length} archived`,
  );
  console.log(`Faces:        ${faces.length} registered`);
  console.log("Staff Management seed complete.");
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
}
