import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomUUID,
} from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { ApiError } from "../../../utils/http.js";

let warned = false;
const encryptionKey = () => {
  const raw = process.env.FACE_ENCRYPTION_KEY;
  if (!raw) {
    if (process.env.NODE_ENV === "production")
      throw new ApiError(500, "FACE_ENCRYPTION_KEY is not set.");
    if (!warned) {
      warned = true;
      console.warn(
        "[face] FACE_ENCRYPTION_KEY not set: using an INSECURE development key.",
      );
    }
    return createHash("sha256").update("hotel-staffhub-face-dev-key").digest();
  }
  const key = /^[0-9a-f]{64}$/i.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64");
  if (key.length !== 32)
    throw new ApiError(
      500,
      "FACE_ENCRYPTION_KEY must be 32 bytes (64 hex characters).",
    );
  return key;
};

export const encrypt = (plain) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const body = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]); // iv(12) + tag(16) + data
};

export const decrypt = (blob) => {
  if (!Buffer.isBuffer(blob) || blob.length < 29)
    throw new ApiError(500, "Stored face image is damaged.");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    blob.subarray(0, 12),
  );
  decipher.setAuthTag(blob.subarray(12, 28));
  try {
    return Buffer.concat([
      decipher.update(blob.subarray(28)),
      decipher.final(),
    ]);
  } catch {
    throw new ApiError(
      500,
      "Could not decrypt the face image (wrong FACE_ENCRYPTION_KEY?).",
    );
  }
};

const driver = () =>
  (
    process.env.FACE_STORAGE_DRIVER ||
    (process.env.R2_FACE_BUCKET ? "r2" : "local")
  ).toLowerCase();

const localRoot = () =>
  path.resolve(process.env.FACE_STORAGE_DIR || "./storage/faces");
const localPath = (key) => {
  const full = path.resolve(localRoot(), key);
  if (!full.startsWith(localRoot() + path.sep))
    throw new ApiError(400, "Invalid storage key.");
  return full;
};

let s3;
const r2 = async () => {
  if (s3) return s3;
  const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } =
    await import("@aws-sdk/client-s3");
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
  s3 = {
    client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    bucket: process.env.R2_FACE_BUCKET,
  };
  return s3;
};

export const saveImage = async ({ hotelId, staffId, buffer, ext = "jpg" }) => {
  const key = `faces/${hotelId}/${staffId}/${randomUUID()}.${ext}.enc`;
  const blob = encrypt(buffer);
  if (driver() === "r2") {
    const { client, PutObjectCommand, bucket } = await r2();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: blob,
        ContentType: "application/octet-stream",
      }),
    );
  } else {
    const file = localPath(key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, blob, { mode: 0o600 });
  }
  return { key };
};

export const readImage = async (key) => {
  if (!key) throw new ApiError(404, "No stored image.");
  let blob;
  try {
    if (driver() === "r2") {
      const { client, GetObjectCommand, bucket } = await r2();
      const res = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key }),
      );
      blob = Buffer.from(await res.Body.transformToByteArray());
    } else {
      blob = await fs.readFile(localPath(key));
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(404, "The stored image was not found.");
  }
  return decrypt(blob);
};

export const removeImages = async (keys = []) => {
  for (const key of keys.filter(Boolean)) {
    try {
      if (driver() === "r2") {
        const { client, DeleteObjectCommand, bucket } = await r2();
        await client.send(
          new DeleteObjectCommand({ Bucket: bucket, Key: key }),
        );
      } else {
        await fs.rm(localPath(key), { force: true });
      }
    } catch (error) {
      console.warn(`[face] could not delete ${key}: ${error.message}`);
    }
  }
};
