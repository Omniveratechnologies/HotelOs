import mongoose from "mongoose";
import {
  Staff,
  StaffDepartment,
  FaceEmbedding,
} from "../../staff-management/models/staffManagement.js";
import { FaceProfile } from "../models/faceProfile.js";
import { FaceSample, FACE_ANGLES } from "../models/faceSample.js";
import { FaceAudit } from "../models/faceAudit.js";
import { ApiError, isObjectId } from "../../../utils/http.js";
import {
  ANGLE_ORDER,
  config,
  cosine,
  judgePhoto,
  poseToAngle,
  round,
  sniffImage,
  startOfToday,
} from "./faceRules.js";
import * as engine from "./faceEngine.service.js";
import * as storage from "./faceStorage.service.js";

const MAX_LIMIT = 100;
const SORT_KEYS = ["staffCode", "name", "joinedOn"];
const FACE_STATUSES = ["REGISTERED", "NOT_REGISTERED"];

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const toId = (value) => new mongoose.Types.ObjectId(String(value));
const activeStaff = (hotelId) => ({
  hotelId,
  deletedAt: null,
  status: "ACTIVE",
});

const audit = async (hotelId, staffId, action, actor, note = "", meta = {}) => {
  try {
    await FaceAudit.create({
      hotelId,
      staffId,
      action,
      actor: { userId: actor?.userId || null, name: actor?.name || "" },
      note,
      meta,
    });
  } catch (error) {
    console.warn(`[face] audit write failed: ${error.message}`); // never block the real work
  }
};

const DEVICE_SERVICE_PATHS = [
  process.env.FACE_DEVICE_SERVICE,
  "../../staff-management/services/attendanceDevice.service.js",
  "../../attendance/services/attendanceDevice.service.js",
  "../../attendance-devices/services/attendanceDevice.service.js",
  "../../devices/services/attendanceDevice.service.js",
  "../../device/services/attendanceDevice.service.js",
].filter(Boolean);

let deviceService;
const loadDeviceService = async () => {
  if (deviceService !== undefined) return deviceService;
  for (const path of DEVICE_SERVICE_PATHS) {
    try {
      deviceService = await import(path);
      return deviceService;
    } catch (error) {
      if (error.code !== "ERR_MODULE_NOT_FOUND") throw error; // found, but it failed to load: show the real error
    }
  }
  deviceService = null;
  console.warn(
    "[face] attendanceDevice.service.js not found: kiosks are not told about changes. Set FACE_DEVICE_SERVICE in .env.",
  );
  return null;
};

const notifyKiosks = async (hotelId, actor) => {
  try {
    const devices = await loadDeviceService();
    if (devices && typeof devices.syncAll === "function")
      return await devices.syncAll(hotelId, actor || {});
  } catch (error) {
    console.warn(`[face] kiosk sync request failed: ${error.message}`);
  }
  return null;
};

const findStaff = async (
  hotelId,
  id,
  select = "name staffCode status photoUrl",
) => {
  if (!isObjectId(id)) throw new ApiError(400, "Invalid staff ID.");
  const staff = await Staff.findOne({
    _id: id,
    hotelId,
    deletedAt: null,
  }).select(select);
  if (!staff) throw new ApiError(404, "Staff not found.");
  return staff;
};

const rowOf = (staff, profile, index) => {
  const registered = profile?.status === "REGISTERED";
  return {
    no: index,
    _id: staff._id,
    staffId: staff.staffCode,
    name: staff.name,
    photoUrl: staff.photoUrl || "",
    department: staff.departmentId?.name || "-",
    designation: staff.designationId?.name || "-",
    faceStatus: registered ? "REGISTERED" : "NOT_REGISTERED",
    action: registered ? "UPDATE" : "REGISTER", // blue "Update" / green "Register" button
    samples: registered ? profile.sampleCount : 0,
    registeredAt: registered ? profile.registeredAt : null,
    lastEnrolledAt: registered ? profile.lastEnrolledAt : null,
  };
};

export const summary = async (hotelId) => {
  const ids = await Staff.distinct("_id", activeStaff(hotelId));
  const total = ids.length;
  const base = { hotelId, status: "REGISTERED", staffId: { $in: ids } };
  const todayStart = startOfToday();

  const [registered, today, updatedToday] = await Promise.all([
    FaceProfile.countDocuments(base),
    FaceProfile.countDocuments({ ...base, registeredAt: { $gte: todayStart } }),
    FaceProfile.countDocuments({
      ...base,
      registeredAt: { $lt: todayStart },
      lastEnrolledAt: { $gte: todayStart },
    }),
  ]);

  const percent = (n) => (total ? Math.round((n / total) * 100) : 0);
  return {
    total,
    registered,
    notRegistered: total - registered,
    todayRegistrations: today, // "New faces added"
    updatedToday,
    percent: {
      registered: percent(registered),
      notRegistered: total ? 100 - percent(registered) : 0,
    },
    // what the Register New Face panel needs to know
    rules: {
      minImages: config.minImages,
      maxImages: config.maxImages,
      consentRequired: config.requireConsent,
      angles: FACE_ANGLES,
    },
    engine: engine.engineMode(),
  };
};

export const filters = async (hotelId) => ({
  departments: (
    await StaffDepartment.find({ hotelId, isActive: true })
      .select("name")
      .sort({ name: 1 })
      .lean()
  ).map((d) => ({ _id: d._id, name: d.name })),
  faceStatuses: [
    { value: "", label: "Face Status" },
    { value: "REGISTERED", label: "Registered" },
    { value: "NOT_REGISTERED", label: "Not Registered" },
  ],
});

const staffQuery = async (hotelId, query = {}) => {
  const q = activeStaff(hotelId);

  const term = String(query.search ?? query.q ?? "").trim();
  if (term)
    q.$or = ["name", "staffCode", "phone", "email"].map((key) => ({
      [key]: new RegExp(escapeRegex(term), "i"),
    }));

  if (query.department_id) {
    if (!isObjectId(query.department_id))
      throw new ApiError(400, "Invalid department.");
    q.departmentId = toId(query.department_id);
  }

  const status = String(query.face_status || "").toUpperCase();
  if (status) {
    if (!FACE_STATUSES.includes(status))
      throw new ApiError(
        400,
        "Face status must be REGISTERED or NOT_REGISTERED.",
      );
    const registered = await FaceProfile.distinct("staffId", {
      hotelId,
      status: "REGISTERED",
    });
    q._id =
      status === "REGISTERED" ? { $in: registered } : { $nin: registered };
  }
  return q;
};
export const listStaff = async (hotelId, query = {}) => {
  const page = Math.max(1, Math.floor(Number(query.page)) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Math.floor(Number(query.limit)) || 10),
  );
  const sort = SORT_KEYS.includes(query.sort) ? query.sort : "staffCode";
  const direction = query.direction === "desc" ? -1 : 1;
  const q = await staffQuery(hotelId, query);

  const [staff, total] = await Promise.all([
    Staff.find(q)
      .populate("departmentId", "name")
      .populate("designationId", "name")
      .select("name staffCode photoUrl departmentId designationId joinedOn")
      .sort({ [sort]: direction, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Staff.countDocuments(q),
  ]);

  const profiles = await FaceProfile.find({
    hotelId,
    staffId: { $in: staff.map((s) => s._id) },
  })
    .select("staffId status sampleCount registeredAt lastEnrolledAt")
    .lean();
  const byStaff = new Map(profiles.map((p) => [String(p.staffId), p]));

  return {
    rows: staff.map((s, i) =>
      rowOf(s, byStaff.get(String(s._id)), (page - 1) * limit + i + 1),
    ),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};
export const staffOptions = async (hotelId, query = {}) => {
  const limit = Math.min(
    50,
    Math.max(1, Math.floor(Number(query.limit)) || 20),
  );
  const q = await staffQuery(hotelId, {
    search: query.q ?? query.search,
    face_status:
      String(query.only || "").toLowerCase() === "unregistered"
        ? "NOT_REGISTERED"
        : "",
  });

  const staff = await Staff.find(q)
    .populate("departmentId", "name")
    .select("name staffCode photoUrl departmentId")
    .sort({ name: 1 })
    .limit(limit)
    .lean();
  const profiles = await FaceProfile.find({
    hotelId,
    status: "REGISTERED",
    staffId: { $in: staff.map((s) => s._id) },
  })
    .select("staffId")
    .lean();
  const registered = new Set(profiles.map((p) => String(p.staffId)));

  return staff.map((s) => ({
    _id: s._id,
    name: s.name,
    staffId: s.staffCode,
    label: `${s.name} (${s.staffCode})`,
    photoUrl: s.photoUrl || "",
    department: s.departmentId?.name || "-",
    faceStatus: registered.has(String(s._id)) ? "REGISTERED" : "NOT_REGISTERED",
  }));
};

const sampleView = (staffId, sample) => ({
  _id: sample._id,
  angle: sample.angle,
  qualityScore: round(sample.qualityScore, 2),
  livenessScore:
    sample.livenessScore == null ? null : round(sample.livenessScore, 2),
  createdAt: sample.createdAt,
  imagePath: `/faces/${staffId}/samples/${sample._id}/image`, // add the API base; needs the same login
});

const profileView = (staff, profile, samples = []) => ({
  staff: {
    _id: staff._id,
    name: staff.name,
    staffId: staff.staffCode,
    photoUrl: staff.photoUrl || "",
  },
  faceStatus:
    profile?.status === "REGISTERED" ? "REGISTERED" : "NOT_REGISTERED",
  action: profile?.status === "REGISTERED" ? "UPDATE" : "REGISTER",
  version: profile?.version || 0,
  sampleCount: profile?.status === "REGISTERED" ? profile.sampleCount : 0,
  avgQuality: profile ? round(profile.avgQuality, 2) : 0,
  registeredAt: profile?.registeredAt || null,
  lastEnrolledAt: profile?.lastEnrolledAt || null,
  lastEnrolledBy: profile?.lastEnrolledBy?.name || "",
  consent: profile?.consent?.given
    ? {
        given: true,
        givenAt: profile.consent.givenAt,
        noticeVersion: profile.consent.noticeVersion,
      }
    : { given: false },
  samples: samples.map((s) => sampleView(staff._id, s)),
});

// GET /faces/:staffId
export const getFace = async (hotelId, staffId) => {
  const staff = await findStaff(hotelId, staffId);
  const profile = await FaceProfile.findOne({
    hotelId,
    staffId: staff._id,
  }).lean();
  const samples =
    profile?.status === "REGISTERED"
      ? await FaceSample.find({
          hotelId,
          staffId: staff._id,
          batchId: profile.batchId,
        })
          .sort({ createdAt: 1 })
          .lean()
      : [];
  return profileView(staff, profile, samples);
};

// GET /faces/:staffId/samples/:sampleId/image
export const readSampleImage = async (hotelId, staffId, sampleId, actor) => {
  if (!isObjectId(staffId) || !isObjectId(sampleId))
    throw new ApiError(400, "Invalid ID.");
  const sample = await FaceSample.findOne({ _id: sampleId, staffId, hotelId })
    .select("imageKey mimeType angle")
    .lean();
  if (!sample) throw new ApiError(404, "Face photo not found.");
  const buffer = await storage.readImage(sample.imageKey);
  await audit(hotelId, toId(staffId), "VIEW_IMAGE", actor, "", {
    sampleId: String(sample._id),
    angle: sample.angle,
  });
  return { buffer, mimeType: sample.mimeType };
};

const prepareImages = (files) => {
  if (!Array.isArray(files) || !files.length)
    throw new ApiError(
      400,
      `Add ${config.minImages}-${config.maxImages} photos (field name: images).`,
    );
  if (files.length < config.minImages)
    throw new ApiError(
      400,
      `Capture at least ${config.minImages} photos from different angles (you sent ${files.length}).`,
    );
  if (files.length > config.maxImages)
    throw new ApiError(400, `Send at most ${config.maxImages} photos.`);

  return files.map((file, i) => {
    const buffer = file?.buffer;
    const type = sniffImage(buffer);
    if (!type)
      throw new ApiError(
        400,
        `Photo ${i + 1} must be a JPEG, PNG or WebP image.`,
      );
    if (buffer.length > config.maxImageBytes)
      throw new ApiError(
        400,
        `Photo ${i + 1} is larger than ${Math.round(config.maxImageBytes / 1048576)} MB.`,
      );
    return { buffer, mime: type.mime, ext: type.ext };
  });
};
const readAngles = (value) => {
  let list = value;
  if (typeof list === "string") {
    try {
      list = JSON.parse(list);
    } catch {
      list = list.split(",");
    }
  }
  return (Array.isArray(list) ? list : [])
    .map((a) => String(a).trim().toUpperCase())
    .map((a) => (FACE_ANGLES.includes(a) ? a : null));
};

const truthy = (value) =>
  value === true ||
  ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
export const checkPhoto = async (hotelId, file) => {
  const type = sniffImage(file?.buffer);
  if (!type)
    throw new ApiError(
      400,
      "Send a JPEG, PNG or WebP image (field name: image).",
    );
  if (file.buffer.length > config.maxImageBytes)
    throw new ApiError(400, "Image is too large.");

  const { results } = await engine.analyze({
    staffId: "",
    images: [{ buffer: file.buffer }],
  });
  const [result] = results;
  const issues = judgePhoto(result);
  return {
    ok: issues.length === 0,
    issues,
    faceCount: result.faceCount,
    quality: { ...result.quality, score: round(result.quality.score, 2) },
    pose: result.pose,
    angle: poseToAngle(result.pose),
    liveness: result.liveness,
  };
};

const duplicateOwner = async (hotelId, staffId, embeddings) => {
  const others = await FaceSample.find({ hotelId, staffId: { $ne: staffId } })
    .select("embedding staffId")
    .lean();
  // samples of staff who left are also compared, so a returning person isn't registered twice
  let best = { score: -1, staffId: null };
  for (const sample of others) {
    if (!sample.embedding) continue;
    for (const embedding of embeddings) {
      const score = cosine(embedding, sample.embedding);
      if (score > best.score) best = { score, staffId: sample.staffId };
    }
  }
  return best.score >= config.duplicateThreshold ? best : null;
};
export const enroll = async (hotelId, body = {}, files = [], actor = {}) => {
  const staffId = body.staffId || body.staff_id;
  const staff = await findStaff(hotelId, staffId);
  if (staff.status !== "ACTIVE")
    throw new ApiError(400, "Only active staff can register a face.");

  const existing = await FaceProfile.findOne({ hotelId, staffId: staff._id });
  const wasRegistered = existing?.status === "REGISTERED";
  const consentNow = truthy(body.consent);
  if (config.requireConsent && !consentNow && !existing?.consent?.given) {
    throw new ApiError(
      400,
      "The staff member's consent is required before face data is stored.",
    );
  }

  const images = prepareImages(files);
  const analysis = await engine.analyze({ staffId: staff._id, images });

  const problems = [];
  analysis.results.forEach((result, i) => {
    const issues = judgePhoto(result);
    if (issues.length) problems.push({ photo: i + 1, issues });
  });
  if (problems.length) {
    const error = new ApiError(
      422,
      `Some photos can't be used: ${problems.map((p) => `Photo ${p.photo}: ${p.issues.join(" ")}`).join(" | ")}`,
    );
    error.details = problems;
    throw error;
  }

  const embeddings = analysis.results.map((r) => r.embedding);
  for (let i = 0; i < embeddings.length; i += 1) {
    for (let j = i + 1; j < embeddings.length; j += 1) {
      if (cosine(embeddings[i], embeddings[j]) < config.samePersonMin)
        throw new ApiError(
          422,
          `Photo ${i + 1} and photo ${j + 1} look like different people. Use photos of one person only.`,
        );
    }
  }

  const clash = await duplicateOwner(hotelId, staff._id, embeddings);
  if (clash) {
    const owner = await Staff.findOne({ _id: clash.staffId, hotelId })
      .select("name staffCode")
      .lean();
    throw new ApiError(
      409,
      `This face is already registered for ${owner ? `${owner.name} (${owner.staffCode})` : "another staff member"}.`,
    );
  }

  const now = new Date();
  const batchId = new mongoose.Types.ObjectId();
  const given = readAngles(body.angles);
  const used = new Set();
  const savedKeys = [];
  let samples;

  try {
    const prepared = [];
    for (let i = 0; i < images.length; i += 1) {
      const result = analysis.results[i];
      let angle = given[i] || poseToAngle(result.pose);
      if (!given[i] && used.has(angle))
        angle = ANGLE_ORDER.find((a) => !used.has(a)) || angle; // pose gave nothing new
      used.add(angle);
      const { key } = await storage.saveImage({
        hotelId: String(hotelId),
        staffId: String(staff._id),
        buffer: images[i].buffer,
        ext: images[i].ext,
      });
      savedKeys.push(key);
      prepared.push({
        hotelId,
        staffId: staff._id,
        batchId,
        angle,
        embedding: result.embedding,
        qualityScore: Math.min(1, Math.max(0, result.quality.score)),
        livenessScore: result.liveness?.score ?? null,
        pose: result.pose,
        imageKey: key,
        mimeType: images[i].mime,
        sizeBytes: images[i].buffer.length,
      });
    }
    samples = await FaceSample.insertMany(prepared);
  } catch (error) {
    await storage.removeImages(savedKeys);
    await FaceSample.deleteMany({ hotelId, staffId: staff._id, batchId });
    throw error;
  }

  const consent =
    consentNow || !existing?.consent?.given
      ? {
          given: true,
          givenAt: now,
          noticeVersion: config.consentVersion,
          recordedBy: { userId: actor.userId || null, name: actor.name || "" },
        }
      : existing.consent;

  const set = {
    status: "REGISTERED",
    batchId,
    sampleCount: samples.length,
    avgQuality: round(
      analysis.results.reduce((sum, r) => sum + r.quality.score, 0) /
        analysis.results.length,
      3,
    ),
    engine: { mode: analysis.mode, model: analysis.model },
    consent,
    lastEnrolledAt: now,
    lastEnrolledBy: { userId: actor.userId || null, name: actor.name || "" },
    syncedAt: now,
    suspendedAt: null,
    removedAt: null,
    removedReason: "",
  };
  if (!wasRegistered) set.registeredAt = now; // a returning (removed) person counts as a new registration

  const profile = await FaceProfile.findOneAndUpdate(
    { hotelId, staffId: staff._id },
    { $set: set, $inc: { version: 1 } },
    { new: true, upsert: true },
  );

  const oldSamples = await FaceSample.find({
    hotelId,
    staffId: staff._id,
    batchId: { $ne: batchId },
  })
    .select("imageKey")
    .lean();
  if (oldSamples.length) {
    await FaceSample.deleteMany({
      hotelId,
      staffId: staff._id,
      batchId: { $ne: batchId },
    });
    await storage.removeImages(oldSamples.map((s) => s.imageKey));
  }
  await FaceEmbedding.findOneAndUpdate(
    { hotelId, staffId: staff._id },
    { $set: { embeddingRef: `face-profile:${profile._id}` } },
    { upsert: true },
  );

  await audit(
    hotelId,
    staff._id,
    wasRegistered ? "UPDATE" : "ENROLL",
    actor,
    "",
    { photos: samples.length, engine: analysis.mode, version: profile.version },
  );
  await notifyKiosks(hotelId, actor);

  const angles = new Set(samples.map((s) => s.angle));
  const warnings = [];
  if (angles.size < 2)
    warnings.push(
      "All photos have the same angle. Different angles recognise people better.",
    );
  if (analysis.mode === "mock")
    warnings.push(
      "Development engine in use: faces are NOT really recognised until FACE_SERVICE_URL is set.",
    );

  return {
    ...profileView(staff, profile, samples),
    warnings,
    updated: wasRegistered,
  };
};
export const purgeProfile = async (
  hotelId,
  staffId,
  { reason = "", actor = {}, action = "DELETE", notify = true } = {},
) => {
  const profile = await FaceProfile.findOne({ hotelId, staffId });
  if (!profile || profile.status === "REMOVED") return false;

  const samples = await FaceSample.find({ hotelId, staffId })
    .select("imageKey")
    .lean();
  await FaceSample.deleteMany({ hotelId, staffId });
  await storage.removeImages(samples.map((s) => s.imageKey));
  await FaceEmbedding.deleteMany({ hotelId, staffId });

  const now = new Date();
  await FaceProfile.updateOne(
    { _id: profile._id },
    {
      $set: {
        status: "REMOVED",
        batchId: null,
        sampleCount: 0,
        avgQuality: 0,
        removedAt: now,
        removedReason: reason.slice(0, 200),
        syncedAt: now,
      },
      $inc: { version: 1 },
    },
  );
  await audit(hotelId, staffId, action, actor, reason.slice(0, 200), {
    photos: samples.length,
  });
  if (notify) await notifyKiosks(hotelId, actor);
  return true;
};

// DELETE /faces/:staffId
export const removeFace = async (hotelId, id, body = {}, actor = {}) => {
  const staff = await findStaff(hotelId, id);
  const removed = await purgeProfile(hotelId, staff._id, {
    reason: String(body.reason || "Removed by admin"),
    actor,
  });
  if (!removed)
    throw new ApiError(404, "This staff member has no face registered.");
  return { staffId: staff._id, faceStatus: "NOT_REGISTERED" };
};

const DEVICE_AUTH_NAMES = [
  "authenticateDevice",
  "deviceFromToken",
  "verifyDeviceToken",
  "findDeviceByToken",
];

const authenticateKiosk = async (token) => {
  if (!token) throw new ApiError(401, "Device token missing.");
  const devices = await loadDeviceService();
  if (!devices)
    throw new ApiError(
      501,
      "Kiosk sync could not find attendanceDevice.service.js. Set FACE_DEVICE_SERVICE in .env.",
    );
  const name = DEVICE_AUTH_NAMES.find((n) => typeof devices[n] === "function");
  if (!name)
    throw new ApiError(
      501,
      "Kiosk sync needs attendanceDevice.service.js to export authenticateDevice(token) -> device. See the setup notes.",
    );
  const device = await devices[name](token);
  if (!device) throw new ApiError(401, "Invalid device token.");
  return device;
};

const readCursor = (raw) => {
  if (!raw) return null;
  const [iso, id] = String(raw).split("|");
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) throw new ApiError(400, "Invalid cursor.");
  return { at, id: id && isObjectId(id) ? toId(id) : null };
};

export const kioskSync = async (token, query = {}) => {
  const device = await authenticateKiosk(token);
  const hotelId = device.hotelId;
  if (!hotelId)
    throw new ApiError(401, "This device is not linked to a hotel.");

  const limit = Math.min(
    100,
    Math.max(1, Math.floor(Number(query.limit)) || 50),
  );
  const cursor = readCursor(query.cursor);
  const filter = { hotelId };
  if (cursor) {
    filter.$or = cursor.id
      ? [
          { syncedAt: { $gt: cursor.at } },
          { syncedAt: cursor.at, _id: { $gt: cursor.id } },
        ]
      : [{ syncedAt: { $gt: cursor.at } }];
  } else {
    filter.status = "REGISTERED"; // a first sync doesn't need tombstones
  }

  const profiles = await FaceProfile.find(filter)
    .sort({ syncedAt: 1, _id: 1 })
    .limit(limit + 1)
    .lean();
  const hasMore = profiles.length > limit;
  const page = profiles.slice(0, limit);

  const live = page.filter((p) => p.status === "REGISTERED");
  const staff = await Staff.find({
    _id: { $in: live.map((p) => p.staffId) },
    hotelId,
    deletedAt: null,
    status: "ACTIVE",
  })
    .select("name staffCode")
    .lean();
  const staffById = new Map(staff.map((s) => [String(s._id), s]));
  const samples = await FaceSample.find({
    hotelId,
    batchId: { $in: live.map((p) => p.batchId) },
  })
    .select("staffId batchId angle embedding")
    .lean();

  const faces = [];
  const removed = [];
  for (const profile of page) {
    const member = staffById.get(String(profile.staffId));
    if (profile.status !== "REGISTERED" || !member) {
      removed.push(String(profile.staffId));
      continue;
    }
    faces.push({
      staffId: String(profile.staffId),
      staffCode: member.staffCode,
      name: member.name,
      version: profile.version,
      embeddings: samples
        .filter(
          (s) => String(s.batchId) === String(profile.batchId) && s.embedding,
        )
        .map((s) => ({ angle: s.angle, embedding: s.embedding })),
    });
  }

  const last = page[page.length - 1];
  return {
    faces,
    removed,
    hasMore,
    next: last
      ? `${last.syncedAt.toISOString()}|${last._id}`
      : query.cursor || null,
    serverTime: new Date().toISOString(),
    dimension: 512,
  };
};

export const applyRetention = async (now = new Date()) => {
  const result = { suspended: 0, restored: 0, purged: 0 };
  const profiles = await FaceProfile.find({
    status: { $in: ["REGISTERED", "SUSPENDED"] },
  })
    .select("hotelId staffId status suspendedAt")
    .lean();
  if (!profiles.length) return result;

  const staff = await Staff.find({
    _id: { $in: profiles.map((p) => p.staffId) },
  })
    .select("status deletedAt")
    .lean();
  const staffById = new Map(staff.map((s) => [String(s._id), s]));
  const cutoff = new Date(now.getTime() - config.retentionDays * 86400000);
  const touched = new Set();

  for (const profile of profiles) {
    const member = staffById.get(String(profile.staffId));
    const left =
      !member || Boolean(member.deletedAt) || member.status !== "ACTIVE";

    if (!left && profile.status === "SUSPENDED") {
      await FaceProfile.updateOne(
        { _id: profile._id },
        {
          $set: { status: "REGISTERED", suspendedAt: null, syncedAt: now },
          $inc: { version: 1 },
        },
      );
      await audit(
        profile.hotelId,
        profile.staffId,
        "RESTORE",
        null,
        "Staff active again",
      );
      result.restored += 1;
      touched.add(String(profile.hotelId));
    } else if (left && profile.status === "REGISTERED") {
      await FaceProfile.updateOne(
        { _id: profile._id },
        {
          $set: { status: "SUSPENDED", suspendedAt: now, syncedAt: now },
          $inc: { version: 1 },
        },
      );
      await audit(
        profile.hotelId,
        profile.staffId,
        "SUSPEND",
        null,
        "Staff left",
      );
      result.suspended += 1;
      touched.add(String(profile.hotelId));
    } else if (
      left &&
      profile.status === "SUSPENDED" &&
      profile.suspendedAt &&
      profile.suspendedAt <= cutoff
    ) {
      if (
        await purgeProfile(profile.hotelId, profile.staffId, {
          reason: `Retention period of ${config.retentionDays} days ended`,
          action: "PURGE",
          notify: false,
        })
      ) {
        result.purged += 1;
        touched.add(String(profile.hotelId));
      }
    }
  }

  for (const hotel of touched) await notifyKiosks(toId(hotel), {});
  return result;
};
