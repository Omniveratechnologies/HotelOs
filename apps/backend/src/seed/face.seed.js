import "dotenv/config";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import mongoose from "mongoose";
import { Staff } from "../modules/staff-management/models/staffManagement.js";
import { FaceProfile } from "../modules/face-recognition/models/faceProfile.js";
import { enroll } from "../modules/face-recognition/services/face.service.js";
import { startOfToday } from "../modules/face-recognition/services/faceRules.js";

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const body = Buffer.concat([Buffer.from(type), data]);
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc(body), 8 + data.length);
  return out;
};
export const samplePng = (seed) => {
  const size = 16,
    header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 2;
  const rows = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y += 1)
    for (let x = 0; x < size * 3; x += 1)
      rows[y * (size * 3 + 1) + 1 + x] = (seed * 37 + x * 11 + y * 7) & 0xff;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
};

export const seedFaces = async (hotelId, { keep = 6, today = 3 } = {}) => {
  if (process.env.FACE_SERVICE_URL)
    throw new Error(
      "The seed uses the mock engine. Unset FACE_SERVICE_URL first.",
    );
  const staff = await Staff.find({ hotelId, deletedAt: null, status: "ACTIVE" })
    .select("_id")
    .sort({ staffCode: 1 })
    .lean();
  const targets = staff.slice(0, Math.max(0, staff.length - keep));
  let created = 0;

  for (const [i, member] of targets.entries()) {
    if (
      await FaceProfile.exists({
        hotelId,
        staffId: member._id,
        status: "REGISTERED",
      })
    )
      continue;
    const files = [1, 2, 3, 4].map((n) => ({ buffer: samplePng(i * 10 + n) }));
    await enroll(
      hotelId,
      {
        staffId: member._id,
        consent: true,
        angles: ["FRONT", "LEFT", "RIGHT", "UP"],
      },
      files,
      { name: "Seed" },
    );
    created += 1;
  }

  const profiles = await FaceProfile.find({ hotelId, status: "REGISTERED" })
    .sort({ _id: 1 })
    .select("_id")
    .lean();
  const start = startOfToday();
  for (const [i, profile] of profiles.entries()) {
    const at =
      i >= profiles.length - today
        ? new Date(start.getTime() + (9 + i) * 60000)
        : new Date(start.getTime() - (1 + (i % 45)) * 86400000);
    await FaceProfile.updateOne(
      { _id: profile._id },
      { $set: { registeredAt: at, lastEnrolledAt: at } },
    );
  }
  return { created, total: profiles.length };
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
  const keepArg = process.argv.find((a) => a.startsWith("--keep="));
  await mongoose.connect(uri);
  const result = await seedFaces(new mongoose.Types.ObjectId(hotel), {
    keep: keepArg ? Number(keepArg.slice(7)) : 6,
  });
  console.log(
    `Faces: ${result.created} registered now, ${result.total} in total`,
  );
  await mongoose.disconnect();
}
