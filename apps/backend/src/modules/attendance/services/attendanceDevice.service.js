// Attendance device business logic: list / stats / map / activity, create / update / delete,
// the heartbeat from the kiosks, commands (Test Connection, Sync Now, Restart) and the monitor
// that flips devices to Offline / Warning. The controller only passes data in and out.
import crypto from "node:crypto";
import { EventEmitter } from "node:events";
import net from "node:net";
import mongoose from "mongoose";
import { AttendanceDevice, DEVICE_TYPES } from "../models/attendanceDevice.js";
import { DeviceEvent } from "../models/deviceEvent.js";
import { DeviceCommand, COMMAND_TYPES } from "../models/deviceCommand.js";
import { ApiError, isObjectId } from "../../../utils/http.js";

// ------------------------------------------------------------------ rules

export const HEARTBEAT_SECONDS = 60; // the kiosk calls every 30-60 s
export const LATE_AFTER_MS = 90 * 1000; // no heartbeat for this long -> WARNING
export const OFFLINE_AFTER_MS = 3 * 60 * 1000; // no heartbeat for 3 minutes -> OFFLINE
export const WARNING_SYNC_ERRORS = 3; // this many failed syncs in a row -> WARNING
export const COMMAND_TIMEOUT_MS = 60 * 1000; // a command not acked by then -> TIMEOUT
// Alert rule: a device that stays OFFLINE this long raises one ALERT (the UI shows a toast)
export const alertAfterMs = () => Math.max(1, Number(process.env.DEVICE_ALERT_OFFLINE_MINUTES) || 5) * 60 * 1000;

// Everything that happens to a device is announced here. deviceSocket.service.js listens and
// pushes it to the kiosks / the admin screens in real time. Nothing else depends on it.
//   "event"   -> { hotelId, deviceId, type, message, at, device }
//   "command" -> { hotelId, deviceId, command }
export const deviceBus = new EventEmitter();

const SORT_KEYS = ["name", "deviceCode", "type", "location", "status", "lastSyncAt", "createdAt"];
const MAX_LIMIT = 200;
const STATUS_ORDER = { ONLINE: 0, WARNING: 1, OFFLINE: 2 };

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const toId = (value) => new mongoose.Types.ObjectId(String(value));
const hashToken = (token) => crypto.createHash("sha256").update(String(token)).digest("hex");

// The status right now, from the last heartbeat. Works without the monitor running.
export const computeDeviceStatus = (device, now = new Date()) => {
  if (!device.lastSeenAt) return "OFFLINE"; // never connected
  const age = now.getTime() - new Date(device.lastSeenAt).getTime();
  if (age >= OFFLINE_AFTER_MS) return "OFFLINE";
  if (age >= LATE_AFTER_MS || (device.consecutiveSyncErrors || 0) >= WARNING_SYNC_ERRORS) return "WARNING";
  return "ONLINE";
};

// ------------------------------------------------------------------ reading input

const readType = (value) => {
  const type = String(value ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (!DEVICE_TYPES.includes(type)) throw new ApiError(400, `Type must be one of ${DEVICE_TYPES.join(", ")}.`);
  return type;
};

const readConfig = (value) => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, "Settings must be a JSON object.");
  }
  if (JSON.stringify(value).length > 5000) throw new ApiError(400, "Settings are too large (5000 characters at most).");
  return value;
};

const readPin = (body) => {
  const clear = body.mapX === null && body.mapY === null;
  if (clear) return { mapX: null, mapY: null };

  const [x, y] = [Number(body.mapX), Number(body.mapY)];
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 100 || y < 0 || y > 100) {
    throw new ApiError(400, "Pin position must be two numbers between 0 and 100.");
  }
  return { mapX: x, mapY: y };
};

// Reads and checks a body. `partial` (update) only checks the fields that were sent.
export const readDeviceBody = (body = {}, { partial = false } = {}) => {
  const value = {};
  const has = (key) => body[key] !== undefined;

  if (!partial || has("name")) {
    const name = String(body.name ?? "").trim().replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 80) throw new ApiError(400, "Device name must be 2-80 characters.");
    value.name = name;
  }

  if (has("deviceCode") && String(body.deviceCode).trim() !== "") {
    const code = String(body.deviceCode).trim().toUpperCase();
    if (!/^[A-Z0-9-]{3,20}$/.test(code)) throw new ApiError(400, "Device ID must be 3-20 letters, digits or dashes (e.g. ADV-FD-001).");
    value.deviceCode = code;
  }

  if (!partial || has("type")) value.type = readType(body.type);

  if (!partial || has("location")) {
    const location = String(body.location ?? "").trim().replace(/\s+/g, " ");
    if (location.length < 2 || location.length > 80) throw new ApiError(400, "Location must be 2-80 characters.");
    value.location = location;
  }

  if (has("ipAddress")) {
    const ip = String(body.ipAddress ?? "").trim();
    if (ip && !net.isIP(ip)) throw new ApiError(400, "IP address is not valid (e.g. 192.168.1.10).");
    value.ipAddress = ip;
  }

  if (has("firmwareVersion")) {
    const version = String(body.firmwareVersion ?? "").trim();
    if (version.length > 30) throw new ApiError(400, "Firmware version is too long.");
    value.firmwareVersion = version;
  }

  if (has("config")) value.config = readConfig(body.config);
  if (has("mapX") || has("mapY")) Object.assign(value, readPin(body));

  return value;
};

// ------------------------------------------------------------------ shaping

export const toRow = (device, now = new Date()) => ({
  _id: device._id,
  name: device.name,
  deviceCode: device.deviceCode,
  type: device.type,
  location: device.location,
  ipAddress: device.ipAddress || "",
  firmwareVersion: device.firmwareVersion || "",
  status: computeDeviceStatus(device, now),
  lastSeenAt: device.lastSeenAt || null,
  lastSyncAt: device.lastSyncAt || null,
  consecutiveSyncErrors: device.consecutiveSyncErrors || 0,
  config: device.config || {},
  mapX: device.mapX ?? null,
  mapY: device.mapY ?? null,
  createdAt: device.createdAt,
});

const textCompare = (a, b) => String(a ?? "").localeCompare(String(b ?? ""), "en", { sensitivity: "base" });

export const sortRows = (rows, sort = "name", direction = "asc") => {
  const key = SORT_KEYS.includes(sort) ? sort : "name";
  const sign = direction === "desc" ? -1 : 1;
  const time = (value) => (value ? new Date(value).getTime() : 0);

  const compare = {
    name: (a, b) => textCompare(a.name, b.name),
    deviceCode: (a, b) => textCompare(a.deviceCode, b.deviceCode),
    type: (a, b) => textCompare(a.type, b.type),
    location: (a, b) => textCompare(a.location, b.location),
    status: (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
    lastSyncAt: (a, b) => time(a.lastSyncAt) - time(b.lastSyncAt),
    createdAt: (a, b) => time(a.createdAt) - time(b.createdAt),
  }[key];

  return [...rows].sort((a, b) => sign * compare(a, b) || textCompare(a.deviceCode, b.deviceCode));
};

// ------------------------------------------------------------------ helpers

const liveDevices = (hotelId) => AttendanceDevice.find({ hotelId, deletedAt: null });

const logEvent = async (device, type, message, at = new Date()) => {
  const event = await DeviceEvent.create({ hotelId: device.hotelId, deviceId: device._id, type, message, createdAt: at });
  deviceBus.emit("event", {
    hotelId: String(device.hotelId),
    deviceId: String(device._id),
    type,
    message,
    at,
    device: { _id: device._id, name: device.name, deviceCode: device.deviceCode, status: computeDeviceStatus(device, at) },
  });
  return event;
};

const announceCommand = (device, command) =>
  deviceBus.emit("command", { hotelId: String(device.hotelId), deviceId: String(device._id), command: commandRow(command) });

// :id may be the Mongo id OR the device code (ADV-FD-001)
const findDevice = async (hotelId, key) => {
  const value = String(key ?? "").trim();
  const filter = isObjectId(value) ? { _id: value } : { deviceCode: value.toUpperCase() };

  const device = await AttendanceDevice.findOne({ hotelId, deletedAt: null, ...filter });
  if (!device) throw new ApiError(404, "Device not found.");
  return device;
};

const duplicateCode = (error) =>
  error?.code === 11000 ? new ApiError(409, "This device ID is already used.") : error;

// "Front Desk Kiosk" -> ADV-FD-001, "Kitchen Entry" -> ADV-KE-002 (next free number)
const nextDeviceCode = async (hotelId, name) => {
  const words = name.toUpperCase().replace(/[^A-Z0-9 ]/g, "").split(/\s+/).filter(Boolean);
  const prefix = (words.length > 1 ? words[0][0] + words[1][0] : (words[0] || "DV").slice(0, 2)).padEnd(2, "X");

  const all = await AttendanceDevice.find({ hotelId }).select("deviceCode").lean();
  const used = new Set(all.map((item) => item.deviceCode));
  const highest = all.reduce((max, item) => Math.max(max, Number(item.deviceCode.split("-").pop()) || 0), 0);

  for (let n = highest + 1; n < highest + 1000; n += 1) {
    const code = `ADV-${prefix}-${String(n).padStart(3, "0")}`;
    if (!used.has(code)) return code;
  }
  throw new ApiError(500, "Could not make a device ID.");
};

const newToken = () => `dvc_${crypto.randomBytes(24).toString("hex")}`;

// ------------------------------------------------------------------ reads

// GET /devices?search=&status=ALL|ONLINE|OFFLINE|WARNING&type=&sort=&direction=&page=&limit=
export const listDevices = async (hotelId, query = {}, now = new Date()) => {
  const status = String(query.status || "ALL").toUpperCase();
  if (status !== "ALL" && !["ONLINE", "OFFLINE", "WARNING"].includes(status)) {
    throw new ApiError(400, "Status must be ALL, ONLINE, OFFLINE or WARNING.");
  }

  const type = String(query.type || "ALL").toUpperCase().replace(/[\s-]+/g, "_");
  if (type !== "ALL" && !DEVICE_TYPES.includes(type)) throw new ApiError(400, "Unknown device type.");

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || MAX_LIMIT));

  const devices = await liveDevices(hotelId).lean();
  const term = String(query.search || query.q || "").trim();
  const pattern = term ? new RegExp(escapeRegex(term), "i") : null;

  const filtered = devices
    .map((device) => toRow(device, now))
    .filter(
      (row) =>
        (status === "ALL" || row.status === status) &&
        (type === "ALL" || row.type === type) &&
        (!pattern || [row.name, row.deviceCode, row.location, row.ipAddress].some((field) => pattern.test(field))),
    );

  const rows = sortRows(filtered, query.sort, String(query.direction).toLowerCase() === "desc" ? "desc" : "asc");

  return {
    rows: rows.slice((page - 1) * limit, page * limit),
    pagination: { page, limit, total: rows.length, totalPages: Math.max(1, Math.ceil(rows.length / limit)) },
  };
};

const percentOf = (part, total) => (total > 0 ? Math.round((part / total) * 100) : 0);

// GET /devices/stats  -> the four cards, the status donut and the device-type bars
export const deviceStats = async (hotelId, now = new Date()) => {
  const rows = (await liveDevices(hotelId).lean()).map((device) => toRow(device, now));
  const total = rows.length;
  const count = (status) => rows.filter((row) => row.status === status).length;

  const counts = { online: count("ONLINE"), offline: count("OFFLINE"), warning: count("WARNING") };

  return {
    total,
    ...counts,
    needsAttention: counts.offline + counts.warning,
    locations: new Set(rows.map((row) => row.location.toLowerCase())).size,
    percent: Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, percentOf(value, total)])),
    types: Object.fromEntries(DEVICE_TYPES.map((type) => [type, rows.filter((row) => row.type === type).length])),
  };
};

// GET /devices/summary  -> everything the Attendance Devices screen needs in ONE call:
// the cards + donut + type bars (stats), the table page (devices + pagination), the floor-map
// pins and the latest activity. Accepts the same query as GET /devices.
export const deviceSummary = async (hotelId, query = {}, now = new Date()) => {
  const [stats, list, map, activity] = await Promise.all([
    deviceStats(hotelId, now),
    listDevices(hotelId, query, now),
    deviceMap(hotelId, now, { all: true }),
    deviceActivity(hotelId, { limit: query.activityLimit }, now),
  ]);
  return { stats, devices: list.rows, pagination: list.pagination, map, activity };
};

// GET /devices/map  -> pins for the floor plan (only devices that were placed)
// { all: true } also returns the devices that are not placed yet (mapX / mapY null): the edit
// mode of the floor plan needs them for its "Not placed" tray.
export const deviceMap = async (hotelId, now = new Date(), { all = false } = {}) => {
  const rows = (await liveDevices(hotelId).lean()).map((device) => toRow(device, now));
  return rows
    .filter((row) => all || (row.mapX !== null && row.mapY !== null))
    .map(({ _id, name, deviceCode, location, status, mapX, mapY }) => ({ _id, name, deviceCode, location, status, mapX, mapY }));
};

// GET /devices/activity?limit=5  -> "Recent Device Activity"
export const deviceActivity = async (hotelId, query = {}, now = new Date()) => {
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 5));
  const events = await DeviceEvent.find({ hotelId }).sort({ createdAt: -1, _id: -1 }).limit(limit).lean();

  const devices = await AttendanceDevice.find({ hotelId, _id: { $in: [...new Set(events.map((event) => String(event.deviceId)))].map(toId) } }).lean();
  const byId = new Map(devices.map((device) => [String(device._id), device]));

  return events.map((event) => {
    const device = byId.get(String(event.deviceId));
    return {
      _id: event._id,
      type: event.type,
      message: event.message,
      at: event.createdAt,
      device: device ? { _id: device._id, name: device.name, deviceCode: device.deviceCode, status: computeDeviceStatus(device, now) } : null,
    };
  });
};

// GET /devices/:id  -> the row + its latest events
export const getDevice = async (hotelId, key, now = new Date()) => {
  const device = await findDevice(hotelId, key);
  const events = await DeviceEvent.find({ hotelId, deviceId: device._id }).sort({ createdAt: -1, _id: -1 }).limit(20).lean();

  return { ...toRow(device.toObject(), now), events };
};

// ------------------------------------------------------------------ create / update / delete

// POST /devices  -> the row + `deviceToken` (shown ONCE: it goes into the kiosk's settings)
export const createDevice = async (hotelId, body = {}, now = new Date()) => {
  const value = readDeviceBody(body);
  const deviceCode = value.deviceCode || (await nextDeviceCode(hotelId, value.name));
  const token = newToken();

  let device;
  try {
    device = await AttendanceDevice.create({
      ...value,
      deviceCode,
      hotelId,
      status: "OFFLINE",
      statusChangedAt: now,
      tokenHash: hashToken(token),
      deletedAt: null,
    });
  } catch (error) {
    throw duplicateCode(error);
  }

  await logEvent(device, "CREATED", "Device registered", now);

  return { ...toRow(device.toObject(), now), deviceToken: token };
};

// PUT /devices/:id   (also used to place a pin: { mapX, mapY })
export const updateDevice = async (hotelId, key, body = {}, now = new Date()) => {
  const device = await findDevice(hotelId, key);
  const value = readDeviceBody(body, { partial: true });

  if (Object.keys(value).length === 0) throw new ApiError(400, "Nothing to update.");

  if (value.deviceCode && value.deviceCode !== device.deviceCode) {
    const clash = await AttendanceDevice.findOne({ hotelId, deviceCode: value.deviceCode, deletedAt: null }).select("_id");
    if (clash) throw new ApiError(409, "This device ID is already used.");
  }

  Object.assign(device, value);

  try {
    await device.save();
  } catch (error) {
    throw duplicateCode(error);
  }

  const onlyPin = Object.keys(value).every((field) => field === "mapX" || field === "mapY");
  if (!onlyPin) await logEvent(device, "UPDATED", "Device settings updated", now);

  return toRow(device.toObject(), now);
};

// DELETE /devices/:id   (kept in the database, so old events and attendance records still make sense)
export const deleteDevice = async (hotelId, key, now = new Date()) => {
  const device = await findDevice(hotelId, key);

  device.deletedAt = now;
  device.tokenHash = ""; // the kiosk can no longer talk to the server
  await device.save();
  await logEvent(device, "REMOVED", "Device removed", now);

  return { deleted: true, message: "Device removed." };
};

// POST /devices/:id/token  -> a new token (the old one stops working at once)
export const regenerateToken = async (hotelId, key, now = new Date()) => {
  const device = await findDevice(hotelId, key);
  const token = newToken();

  device.tokenHash = hashToken(token);
  await device.save();
  await logEvent(device, "UPDATED", "Device token regenerated", now);

  return { _id: device._id, deviceCode: device.deviceCode, deviceToken: token };
};

// ------------------------------------------------------------------ heartbeat (called by the kiosks)

const deviceByToken = async (token) => {
  const value = String(token ?? "").trim();
  if (!value) throw new ApiError(401, "Device token is missing.");

  const device = await AttendanceDevice.findOne({ tokenHash: hashToken(value), deletedAt: null });
  if (!device) throw new ApiError(401, "Device token is not valid.");
  return device;
};

// Stores the new state, and writes an event only when the state really changed
const settleStatus = async (device, now) => {
  const next = computeDeviceStatus(device, now);
  if (next === device.status) return false;

  device.status = next;
  device.statusChangedAt = now;
  if (next === "ONLINE") device.alertedAt = null; // the next outage may alert again
  await device.save();

  const messages = { ONLINE: "Device is online", WARNING: "Connection unstable", OFFLINE: "Device offline" };
  await logEvent(device, next, messages[next], now);
  return true;
};

// POST /devices/heartbeat   header x-device-token
//   body: { ipAddress?, firmwareVersion?, sync?: { ok: true } | { ok: false, error } }
// The answer carries the commands waiting for this kiosk.
export const heartbeat = async (token, body = {}, now = new Date()) => {
  const device = await deviceByToken(token);

  device.lastSeenAt = now;
  if (body.ipAddress !== undefined) {
    const ip = String(body.ipAddress).trim();
    if (ip && !net.isIP(ip)) throw new ApiError(400, "ipAddress is not valid.");
    device.ipAddress = ip;
  }
  if (body.firmwareVersion !== undefined) device.firmwareVersion = String(body.firmwareVersion).trim().slice(0, 30);

  let syncEvent = null;
  if (body.sync && typeof body.sync === "object") {
    if (body.sync.ok === false) {
      device.consecutiveSyncErrors = (device.consecutiveSyncErrors || 0) + 1;
      syncEvent = ["SYNC_FAILED", String(body.sync.error || "Sync failed").slice(0, 200)];
    } else {
      device.lastSyncAt = now;
      device.consecutiveSyncErrors = 0;
      syncEvent = ["SYNC_OK", "Synced successfully"];
    }
  }

  await device.save(); // lastSeenAt is saved even when the status does not change
  if (syncEvent) await logEvent(device, syncEvent[0], syncEvent[1], now);
  await settleStatus(device, now);

  const pending = await DeviceCommand.find({
    deviceId: device._id,
    status: { $in: ["PENDING", "SENT"] },
    expiresAt: { $gt: now },
  })
    .sort({ createdAt: 1 })
    .limit(10);

  for (const command of pending) {
    if (command.status === "PENDING") {
      command.status = "SENT";
      command.sentAt = now;
      await command.save();
    }
  }

  return {
    serverTime: now,
    intervalSeconds: HEARTBEAT_SECONDS,
    commands: pending.map((command) => ({ _id: command._id, type: command.type })),
  };
};

// Called by the socket layer right after it pushed a command to the kiosk
export const markCommandSent = async (commandId, now = new Date()) => {
  const command = await DeviceCommand.findOne({ _id: commandId, status: "PENDING" });
  if (!command) return null;
  command.status = "SENT";
  command.sentAt = now;
  await command.save();
  return command;
};

// Used when a kiosk connects through the socket: authenticates the token
export const authenticateDevice = (token) => deviceByToken(token);

// ------------------------------------------------------------------ commands (sent from the UI)

const commandRow = (command) => ({
  _id: command._id,
  deviceId: command.deviceId,
  type: command.type,
  status: command.status,
  result: command.result || null,
  createdAt: command.createdAt,
  ackedAt: command.ackedAt || null,
});

// POST /devices/:id/commands   { type: TEST_CONNECTION | SYNC_NOW | RESTART }
export const createCommand = async (hotelId, key, body = {}, actor = {}, now = new Date()) => {
  const device = await findDevice(hotelId, key);
  const type = String(body.type ?? "").trim().toUpperCase();

  if (!COMMAND_TYPES.includes(type)) throw new ApiError(400, `Command must be one of ${COMMAND_TYPES.join(", ")}.`);
  if (computeDeviceStatus(device, now) === "OFFLINE") {
    throw new ApiError(409, `${device.name} is offline, so it cannot receive commands.`);
  }

  const command = await DeviceCommand.create({
    hotelId,
    deviceId: device._id,
    type,
    status: "PENDING",
    requestedBy: actor.name || "",
    expiresAt: new Date(now.getTime() + COMMAND_TIMEOUT_MS),
  });

  await logEvent(device, "COMMAND", `${type.replace("_", " ").toLowerCase()} requested`, now);
  announceCommand(device, command);

  return commandRow(command);
};

// GET /devices/:id/commands/:commandId   (the UI polls this until the kiosk answers)
export const getCommand = async (hotelId, key, commandId, now = new Date()) => {
  const device = await findDevice(hotelId, key);
  if (!isObjectId(commandId)) throw new ApiError(400, "Invalid command ID.");

  const command = await DeviceCommand.findOne({ _id: commandId, hotelId, deviceId: device._id });
  if (!command) throw new ApiError(404, "Command not found.");

  if (["PENDING", "SENT"].includes(command.status) && new Date(command.expiresAt) <= now) {
    command.status = "TIMEOUT";
    command.result = { ok: false, message: "The device did not answer in time." };
    await command.save();
    await logEvent(device, "COMMAND", `${command.type.replace("_", " ").toLowerCase()} timed out`, now);
    announceCommand(device, command);
  }

  return commandRow(command);
};

// POST /devices/commands/:commandId/ack   header x-device-token   body: { ok, message?, latencyMs? }
export const ackCommand = async (token, commandId, body = {}, now = new Date()) => {
  const device = await deviceByToken(token);
  if (!isObjectId(commandId)) throw new ApiError(400, "Invalid command ID.");

  const command = await DeviceCommand.findOne({ _id: commandId, deviceId: device._id });
  if (!command) throw new ApiError(404, "Command not found.");
  if (["ACKED", "FAILED", "TIMEOUT"].includes(command.status)) throw new ApiError(409, "This command is already closed.");

  const ok = body.ok !== false;
  command.status = ok ? "ACKED" : "FAILED";
  command.ackedAt = now;
  command.result = {
    ok,
    message: String(body.message ?? (ok ? "Done" : "Failed")).slice(0, 200),
    ...(Number.isFinite(Number(body.latencyMs)) ? { latencyMs: Number(body.latencyMs) } : {}),
  };
  await command.save();

  if (ok && command.type === "SYNC_NOW") {
    device.lastSyncAt = now;
    device.consecutiveSyncErrors = 0;
    await device.save();
    await logEvent(device, "SYNC_OK", "Synced successfully", now);
  } else if (!ok && command.type === "SYNC_NOW") {
    device.consecutiveSyncErrors = (device.consecutiveSyncErrors || 0) + 1;
    await device.save();
    await logEvent(device, "SYNC_FAILED", command.result.message, now);
  }
  announceCommand(device, command);

  return commandRow(command);
};

// POST /devices/sync-all  -> a SYNC_NOW for every device that is not offline
export const syncAll = async (hotelId, actor = {}, now = new Date()) => {
  const devices = await liveDevices(hotelId);
  let queued = 0;
  let skipped = 0;

  for (const device of devices) {
    if (computeDeviceStatus(device, now) === "OFFLINE") {
      skipped += 1;
      continue;
    }
    const command = await DeviceCommand.create({
      hotelId,
      deviceId: device._id,
      type: "SYNC_NOW",
      status: "PENDING",
      requestedBy: actor.name || "",
      expiresAt: new Date(now.getTime() + COMMAND_TIMEOUT_MS),
    });
    announceCommand(device, command);
    queued += 1;
  }

  return { queued, skippedOffline: skipped };
};

// ------------------------------------------------------------------ monitor

// Run every minute (see startDeviceMonitor): flips devices to OFFLINE / WARNING when their
// heartbeat stops, and writes one event per change. Safe to run twice.
export const checkDevices = async (now = new Date()) => {
  const devices = await AttendanceDevice.find({ deletedAt: null });
  let changed = 0;

  let alerts = 0;

  for (const device of devices) {
    if (await settleStatus(device, now)) changed += 1;

    // Alert rule: offline for N minutes -> one ALERT per outage
    if (device.status === "OFFLINE" && !device.alertedAt) {
      const since = device.lastSeenAt || device.statusChangedAt;
      if (since && now.getTime() - new Date(since).getTime() >= alertAfterMs()) {
        const minutes = Math.round((now.getTime() - new Date(since).getTime()) / 60000);
        device.alertedAt = now;
        await device.save();
        await logEvent(device, "ALERT", `${device.name} has been offline for ${minutes} minutes`, now);
        alerts += 1;
      }
    }
  }

  return { checked: devices.length, changed, alerts };
};

// Call once after the database is connected, e.g. in server.js:
//   startDeviceMonitor();
export const startDeviceMonitor = ({ intervalMs = 60 * 1000 } = {}) => {
  const timer = setInterval(() => {
    checkDevices().catch((error) => console.error("Device monitor failed:", error));
  }, intervalMs);

  timer.unref?.(); // never keeps the process alive on its own
  return () => clearInterval(timer);
};