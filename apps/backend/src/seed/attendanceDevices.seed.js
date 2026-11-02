import "dotenv/config";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { AttendanceDevice } from "../modules/attendance/models/attendanceDevice.js";
import { DeviceEvent } from "../modules/attendance/models/deviceEvent.js";
import {
  createDevice,
  regenerateToken,
  heartbeat,
  checkDevices,
} from "../modules/attendance/services/attendanceDevice.service.js";

const MIN = 60 * 1000;

const DEVICES = [
  [
    "Front Desk Kiosk",
    "ADV-FD-001",
    "FACE_RECOGNITION",
    "Main Lobby",
    "192.168.1.10",
    "online",
    45,
    48,
    22,
  ],
  [
    "Restaurant Kiosk",
    "ADV-RS-002",
    "FINGERPRINT",
    "Restaurant",
    "192.168.1.11",
    "online",
    47,
    76,
    20,
  ],
  [
    "Kitchen Entry",
    "ADV-KT-003",
    "FACE_RECOGNITION",
    "Kitchen",
    "192.168.1.12",
    "online",
    46,
    88,
    50,
  ],
  [
    "Housekeeping Gate",
    "ADV-HK-004",
    "FACE_RECOGNITION",
    "Housekeeping",
    "192.168.1.13",
    "offline",
    900,
    42,
    50,
  ],
  [
    "Staff Entrance",
    "ADV-EN-005",
    "RFID",
    "Staff Entrance",
    "192.168.1.14",
    "online",
    47,
    18,
    26,
  ],
  [
    "Maintenance Room",
    "ADV-MT-006",
    "FINGERPRINT",
    "Maintenance",
    "192.168.1.15",
    "online",
    49,
    46,
    74,
  ],
  [
    "Security Post",
    "ADV-SC-007",
    "FACE_RECOGNITION",
    "Security",
    "192.168.1.16",
    "warning",
    70,
    20,
    62,
  ],
  [
    "Back Gate Kiosk",
    "ADV-BG-008",
    "RFID",
    "Service Gate",
    "192.168.1.17",
    "online",
    50,
    84,
    76,
  ],
];

const hotelIdFromEnv = () => {
  const id = process.env.STAFF_DEFAULT_HOTEL_ID;
  if (!id || !mongoose.isValidObjectId(id)) {
    console.error("Set STAFF_DEFAULT_HOTEL_ID (a valid ObjectId) in .env");
    process.exit(1);
  }
  return new mongoose.Types.ObjectId(id);
};

export const seedDevices = async (hotelId, now = new Date()) => {
  let created = 0;

  for (const [
    name,
    deviceCode,
    type,
    location,
    ipAddress,
    mode,
    syncMinutesAgo,
    mapX,
    mapY,
  ] of DEVICES) {
    if (await AttendanceDevice.exists({ hotelId, deviceCode, deletedAt: null }))
      continue;

    await createDevice(
      hotelId,
      {
        name,
        deviceCode,
        type,
        location,
        ipAddress,
        firmwareVersion: "2.4.1",
        mapX,
        mapY,
      },
      now,
    );
    const device = await AttendanceDevice.findOne({ hotelId, deviceCode });

    const lastSyncAt = new Date(now.getTime() - syncMinutesAgo * MIN);
    device.lastSyncAt = lastSyncAt;
    device.lastSeenAt =
      mode === "offline"
        ? new Date(now.getTime() - 15 * 60 * MIN)
        : new Date(now.getTime() - 20 * 1000);
    device.consecutiveSyncErrors = mode === "warning" ? 3 : 0;
    device.status =
      mode === "online" ? "ONLINE" : mode === "warning" ? "WARNING" : "OFFLINE";
    device.statusChangedAt = lastSyncAt;
    await device.save();

    const events =
      mode === "offline"
        ? [["OFFLINE", "Device offline"]]
        : mode === "warning"
          ? [["WARNING", "Connection unstable"]]
          : [["SYNC_OK", "Synced successfully"]];

    await DeviceEvent.create({
      hotelId,
      deviceId: device._id,
      type: events[0][0],
      message: events[0][1],
      createdAt:
        mode === "online"
          ? lastSyncAt
          : new Date(now.getTime() - (mode === "offline" ? 15 * 60 : 40) * MIN),
    });

    created += 1;
  }

  return { created, total: DEVICES.length };
};

const simulate = async (hotelId) => {
  const kiosks = [];

  for (const [, deviceCode, , , , mode] of DEVICES) {
    if (mode === "offline") continue;
    const { deviceToken } = await regenerateToken(hotelId, deviceCode);
    kiosks.push({ deviceCode, deviceToken, mode });
  }

  console.log(`Simulating ${kiosks.length} kiosks. Press Ctrl+C to stop.`);

  let beat = 0;
  const tick = async () => {
    beat += 1;
    for (const kiosk of kiosks) {
      const sync =
        kiosk.mode === "warning"
          ? { ok: false, error: "Upload timed out" }
          : beat % 5 === 0
            ? { ok: true }
            : undefined;
      await heartbeat(kiosk.deviceToken, { sync }).catch((error) =>
        console.error(kiosk.deviceCode, error.message),
      );
    }
    await checkDevices();
  };

  await tick();
  setInterval(() => tick().catch(console.error), 30 * 1000);
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
  const hotelId = hotelIdFromEnv();

  console.log(await seedDevices(hotelId));

  if (process.argv.includes("--simulate")) {
    await simulate(hotelId);
  } else {
    await mongoose.disconnect();
  }
}
