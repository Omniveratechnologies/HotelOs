import { createHash } from "node:crypto";
import { ApiError } from "../../../utils/http.js";
import { EMBEDDING_DIM } from "../models/faceSample.js";
import { normalize } from "./faceRules.js";

export const engineMode = () => {
  if (process.env.FACE_SERVICE_URL) return "remote";
  if (
    process.env.NODE_ENV === "production" &&
    process.env.FACE_ENGINE !== "mock"
  )
    return "none";
  return "mock";
};

const stream = (seed, length) => {
  const out = [];
  let counter = 0;
  while (out.length < length) {
    const block = createHash("sha256").update(`${seed}:${counter++}`).digest();
    for (let i = 0; i + 1 < block.length && out.length < length; i += 2)
      out.push(block.readUInt16BE(i) / 32767.5 - 1);
  }
  return out;
};

const mockOne = (staffId, buffer) => {
  const base = stream(`staff:${staffId}`, EMBEDDING_DIM);
  const noise = stream(
    `img:${createHash("sha256").update(buffer).digest("hex")}`,
    EMBEDDING_DIM,
  );
  const hash = createHash("sha256").update(buffer).digest();
  return {
    faceCount: 1,
    embedding: normalize(base.map((x, i) => x + 0.25 * noise[i])),
    quality: {
      score: 0.85 + (hash[0] / 255) * 0.1,
      blur: 0,
      brightness: 0,
      faceRatio: 0,
    },
    pose: { yaw: 0, pitch: 0, roll: 0 },
    liveness: { score: 0.99, passed: true, checked: false },
    issues: [],
  };
};
const num = (value, fallback = 0) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;

const readResult = (raw = {}) => ({
  faceCount: num(raw.face_count ?? raw.faceCount, 0),
  embedding: Array.isArray(raw.embedding) ? raw.embedding.map(Number) : null,
  quality: {
    score: num(raw.quality?.score ?? raw.quality_score ?? raw.qualityScore, 0),
    blur: num(raw.quality?.blur),
    brightness: num(raw.quality?.brightness),
    faceRatio: num(raw.quality?.face_ratio ?? raw.quality?.faceRatio),
  },
  pose: {
    yaw: num(raw.pose?.yaw),
    pitch: num(raw.pose?.pitch),
    roll: num(raw.pose?.roll),
  },
  liveness: raw.liveness
    ? {
        score: raw.liveness.score ?? null,
        passed: raw.liveness.passed ?? null,
        checked: raw.liveness.checked ?? raw.liveness.passed != null,
      }
    : { score: null, passed: null, checked: false },
  issues: Array.isArray(raw.issues) ? raw.issues.map(String) : [],
});

const callRemote = async (staffId, images) => {
  const base = process.env.FACE_SERVICE_URL.replace(/\/+$/, "");
  let response;
  try {
    response = await fetch(`${base}/faces/analyze`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.FACE_SERVICE_KEY
          ? { "x-api-key": process.env.FACE_SERVICE_KEY }
          : {}),
      },
      body: JSON.stringify({
        staff_id: String(staffId || ""),
        images: images.map((image) => ({
          data: image.buffer.toString("base64"),
        })),
      }),
      signal: AbortSignal.timeout(
        num(process.env.FACE_SERVICE_TIMEOUT_MS, 20000),
      ),
    });
  } catch {
    throw new ApiError(
      503,
      "The face recognition service is not reachable right now. Try again in a moment.",
    );
  }
  if (!response.ok)
    throw new ApiError(
      502,
      `The face recognition service failed (HTTP ${response.status}).`,
    );

  const body = await response.json().catch(() => null);
  if (
    !body ||
    !Array.isArray(body.results) ||
    body.results.length !== images.length
  )
    throw new ApiError(
      502,
      "The face recognition service sent an unexpected answer.",
    );
  return {
    model: String(body.model || "insightface"),
    results: body.results.map(readResult),
  };
};

export const analyze = async ({ staffId, images }) => {
  const mode = engineMode();
  if (mode === "none")
    throw new ApiError(
      503,
      "Face recognition is not configured: set FACE_SERVICE_URL.",
    );
  if (mode === "mock")
    return {
      mode,
      model: "mock",
      results: images.map((image) => mockOne(staffId, image.buffer)),
    };

  const { model, results } = await callRemote(staffId, images);
  for (const result of results) {
    if (
      result.faceCount === 1 &&
      (!result.embedding ||
        result.embedding.length !== EMBEDDING_DIM ||
        result.embedding.some((x) => !Number.isFinite(x)))
    ) {
      throw new ApiError(
        502,
        `The face recognition service must return a ${EMBEDDING_DIM}-number embedding.`,
      );
    }
    if (result.embedding) result.embedding = normalize(result.embedding);
  }
  return { mode, model, results };
};
