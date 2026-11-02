import crypto from "node:crypto";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { ApiError } from "../../../utils/http.js";

const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

let client;

const config = () => {
  const {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME,
    R2_PUBLIC_URL,
  } = process.env;
  console.log("R2 check:", {
    R2_ACCOUNT_ID: !!process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: !!process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: !!process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: !!process.env.R2_BUCKET_NAME,
    R2_PUBLIC_URL: !!process.env.R2_PUBLIC_URL,
  });
  if (
    !R2_ACCOUNT_ID ||
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !R2_BUCKET_NAME ||
    !R2_PUBLIC_URL
  ) {
    throw new ApiError(
      500,
      "Photo storage is not configured (check the R2_* environment variables).",
    );
  }
  return {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME,
    R2_PUBLIC_URL,
  };
};

const getClient = (c) => {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${c.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: c.R2_ACCESS_KEY_ID,
        secretAccessKey: c.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
};

export const detectImageType = (buffer) => {
  if (
    buffer.length > 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  )
    return "image/jpeg";
  if (
    buffer.length > 8 &&
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return "image/png";
  if (
    buffer.length > 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  return null;
};

export const uploadStaffPhoto = async ({ buffer, hotelId, staffId }) => {
  const type = detectImageType(buffer);
  if (!type) throw new ApiError(400, "Photo must be a JPG, PNG or WEBP image.");

  const c = config();
  const key = `staff/${hotelId}/${staffId}-${crypto.randomBytes(4).toString("hex")}.${EXTENSIONS[type]}`;

  await getClient(c).send(
    new PutObjectCommand({
      Bucket: c.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: type,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return { key, url: `${c.R2_PUBLIC_URL.replace(/\/+$/, "")}/${key}` };
};

export const deleteStaffPhotoByUrl = async (url) => {
  try {
    const c = config();
    const base = `${c.R2_PUBLIC_URL.replace(/\/+$/, "")}/`;
    if (!url || !url.startsWith(base)) return;
    await getClient(c).send(
      new DeleteObjectCommand({
        Bucket: c.R2_BUCKET_NAME,
        Key: url.slice(base.length),
      }),
    );
  } catch (error) {
    console.error("Could not delete old staff photo:", error.message);
  }
};
