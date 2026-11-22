import { FACE_ANGLES } from "../models/faceSample.js";

const num = (key, fallback) => {
  const raw = process.env[key];
  const value = raw === undefined || raw === "" ? NaN : Number(raw);
  return Number.isFinite(value) ? value : fallback;
};
const flag = (key, fallback) => {
  const raw = process.env[key];
  return raw === undefined || raw === ""
    ? fallback
    : ["1", "true", "yes"].includes(String(raw).toLowerCase());
};

export const config = {
  get minImages() {
    return num("FACE_MIN_IMAGES", 3);
  }, // "Capture 3-5 different angles"
  get maxImages() {
    return num("FACE_MAX_IMAGES", 5);
  },
  get maxImageBytes() {
    return num("FACE_MAX_IMAGE_MB", 3) * 1024 * 1024;
  },
  get minQuality() {
    return num("FACE_MIN_QUALITY", 0.6);
  }, // 0-1
  get duplicateThreshold() {
    return num("FACE_DUPLICATE_THRESHOLD", 0.6);
  }, // cosine: same face on another staff
  get samePersonMin() {
    return num("FACE_SAME_PERSON_MIN", 0.35);
  }, // cosine: all photos must be one person
  get requireConsent() {
    return flag("FACE_REQUIRE_CONSENT", true);
  },
  get requireLiveness() {
    return flag("FACE_REQUIRE_LIVENESS", false);
  }, // true = a liveness result is mandatory
  get retentionDays() {
    return num("FACE_RETENTION_DAYS", 30);
  }, // after staff leave
  get consentVersion() {
    return process.env.FACE_CONSENT_VERSION || "v1";
  },
  get timezone() {
    return process.env.HOTEL_TIMEZONE || "Asia/Kolkata";
  },
  get adminRoles() {
    return (process.env.FACE_ADMIN_ROLES || "admin,hr,manager,owner,superadmin")
      .split(",")
      .map((r) => r.trim().toLowerCase())
      .filter(Boolean);
  },
  get strictAuth() {
    return flag("FACE_STRICT_AUTH", false);
  },
};

export const ANGLE_ORDER = FACE_ANGLES; // used when the browser doesn't say which angle a photo is
export const poseToAngle = (pose = {}) => {
  const yaw = Number(pose.yaw) || 0;
  const pitch = Number(pose.pitch) || 0;
  if (Math.abs(yaw) >= 15) return yaw > 0 ? "RIGHT" : "LEFT";
  if (pitch >= 12) return "UP";
  if (pitch <= -12) return "DOWN";
  return "FRONT";
};

export const dot = (a, b) => {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) sum += a[i] * b[i];
  return sum;
};
export const norm = (a) => Math.sqrt(dot(a, a));
export const cosine = (a, b) => {
  const d = norm(a) * norm(b);
  return d === 0 ? 0 : dot(a, b) / d;
};
export const normalize = (a) => {
  const n = norm(a) || 1;
  return a.map((x) => x / n);
};

export const round = (value, digits = 3) =>
  Math.round(Number(value) * 10 ** digits) / 10 ** digits;
export const sniffImage = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
    return { mime: "image/jpeg", ext: "jpg" };
  if (
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return { mime: "image/png", ext: "png" };
  if (
    buffer.subarray(0, 4).toString("latin1") === "RIFF" &&
    buffer.subarray(8, 12).toString("latin1") === "WEBP"
  )
    return { mime: "image/webp", ext: "webp" };
  return null;
};
export const judgePhoto = (result) => {
  const issues = [];
  if (!result || result.faceCount === 0)
    return ["No face found. Look straight at the camera."];
  if (result.faceCount > 1) return ["More than one face in the photo."];
  if (result.quality?.score < config.minQuality)
    issues.push("Photo quality is too low (light, blur or face too small).");
  if (result.liveness?.passed === false)
    issues.push("Live person not detected (photo or screen suspected).");
  if (
    config.requireLiveness &&
    (result.liveness?.checked === false || result.liveness == null)
  )
    issues.push(
      "Liveness check is required but the face service did not run it.",
    );
  for (const extra of result.issues || [])
    if (!issues.includes(extra)) issues.push(extra);
  return issues;
};

export const startOfToday = (now = new Date(), timeZone = config.timezone) => {
  const key = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(
    +parts.year,
    +parts.month - 1,
    +parts.day,
    +parts.hour,
    +parts.minute,
    +parts.second,
  );
  const offset =
    Math.round((asUtc - Math.floor(now.getTime() / 1000) * 1000) / 60000) *
    60000;
  return new Date(Date.parse(`${key}T00:00:00Z`) - offset);
};
