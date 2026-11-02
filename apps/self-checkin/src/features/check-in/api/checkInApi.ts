import {
  api,
  lookupCheckInBooking,
  verifyCheckInOtp,
  resolvePublicCheckIn,
  savePublicCheckInStep,
  submitPublicCheckIn,
  uploadToR2,
} from "@hotelos/api";
import type {
  CheckInSessionData,
  FileRef,
  LookupResponse,
  VerifyOtpResponse,
} from "../types/checkIn.types";

export async function lookupBooking(
  identifier: string,
): Promise<LookupResponse> {
  const data = await lookupCheckInBooking(identifier);
  return data as LookupResponse;
}

export async function verifyOtp(
  reservationId: string,
  code: string,
): Promise<VerifyOtpResponse> {
  const data = await verifyCheckInOtp(reservationId, code);
  return data as VerifyOtpResponse;
}

export async function resolveCheckIn(
  token: string,
): Promise<CheckInSessionData> {
  const data = await resolvePublicCheckIn(token);
  return data as CheckInSessionData;
}

export async function saveCheckInStep(
  token: string,
  step: string,
  payload: Record<string, unknown>,
): Promise<CheckInSessionData> {
  const data = await savePublicCheckInStep(token, step, payload);
  return data as CheckInSessionData;
}

export async function submitCheckIn(
  token: string,
  payload?: Record<string, unknown>,
): Promise<CheckInSessionData> {
  const data = await submitPublicCheckIn(token, payload);
  return data as CheckInSessionData;
}

function normalizeMime(file: File): string {
  let type = file.type;
  if (type === "image/jpg") type = "image/jpeg";
  if (!type && file.name) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "jpg" || ext === "jpeg") type = "image/jpeg";
    else if (ext === "png") type = "image/png";
    else if (ext === "webp") type = "image/webp";
    else if (ext === "pdf") type = "application/pdf";
  }
  return type || "image/jpeg";
}

export async function uploadCheckInFile(
  token: string,
  file: File,
): Promise<FileRef> {
  const base = `/api/v1/public/check-in/${token}`;
  const mimeType = normalizeMime(file);
  const result = await api.post(`${base}/uploads`, {
    files: [
      {
        filename: file.name || "upload.jpg",
        mimeType,
        size: file.size,
      },
    ],
  });

  const [upload] = (result.data || []) as Array<{
    uploadUrl: string;
    downloadUrl?: string;
    key: string;
    filename: string;
    mimeType: string;
    size: number;
  }>;

  if (!upload) {
    throw new Error("Failed to acquire upload credentials");
  }

  const fileToUpload =
    file.type === mimeType
      ? file
      : new File([file], file.name || "upload.jpg", { type: mimeType });

  await uploadToR2(upload.uploadUrl, fileToUpload);

  return {
    key: upload.key,
    filename: upload.filename,
    mimeType: upload.mimeType,
    size: upload.size,
    url: upload.downloadUrl,
    previewUrl: upload.downloadUrl,
  };
}
