import { api, uploadToR2 } from "@hotelos/api";

// Token-scoped public API for guest self check-in (no receptionist auth).

const base = (token) => `/api/v1/public/check-in/${token}`;

export async function resolveCheckIn(token) {
  const result = await api.get(base(token));
  return result.data;
}

export async function saveCheckInStep(token, step, payload) {
  const result = await api.put(`${base(token)}/steps/${step}`, payload);
  return result.data;
}

export async function submitCheckIn(token) {
  const result = await api.post(`${base(token)}/submit`, {});
  return result.data;
}

/**
 * Uploads one check-in file (ID / selfie / signature) via presigned R2 URL
 * and returns the file reference to persist with the step save.
 */
export async function uploadCheckInFile(token, file) {
  const [upload] = await (async () => {
    const result = await api.post(`${base(token)}/uploads`, {
      files: [
        {
          filename: file.name || "upload",
          mimeType: file.type,
          size: file.size,
        },
      ],
    });
    return result.data || [];
  })();

  await uploadToR2(upload.uploadUrl, file);

  return {
    key: upload.key,
    filename: upload.filename,
    mimeType: upload.mimeType,
    size: upload.size,
  };
}
