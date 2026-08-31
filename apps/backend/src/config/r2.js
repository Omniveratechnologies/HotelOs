import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import env from "./env.js";

// Cloudflare R2 is S3-compatible; use the S3 SDK pointed at the R2 endpoint.
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${env.r2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.r2.accessKeyId,
    secretAccessKey: env.r2.secretAccessKey,
  },
});

export const R2_BUCKET = env.r2.bucketName;

// Generate a presigned URL that lets the client upload an object directly to R2.
export async function generateUploadUrl(key, { contentType, expiresIn } = {}) {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ...(contentType ? { ContentType: contentType } : {}),
  });

  return getSignedUrl(r2Client, command, {
    expiresIn: expiresIn || env.r2.urlTtlSeconds,
  });
}

// Generate a presigned URL that lets the client download an object from R2.
export async function generateDownloadUrl(key, { expiresIn } = {}) {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });

  return getSignedUrl(r2Client, command, {
    expiresIn: expiresIn || env.r2.urlTtlSeconds,
  });
}

// Best-effort deletion of R2 objects referenced by their keys.
export async function deleteObjects(keys) {
  await Promise.allSettled(
    (keys || []).map((key) =>
      r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key })),
    ),
  );
}
