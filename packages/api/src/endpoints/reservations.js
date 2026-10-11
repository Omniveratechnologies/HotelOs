import { api } from "../apiFetch.js";
import { getDocumentUploadUrls, uploadToR2 } from "./guests.js";

/**
 * Fetches reservations (bookings) list, optionally filtered by status.
 * @param {string} [status]
 * @returns {Promise<Array<object>>}
 */
export const getReservations = async (status) => {
  const result = await api.get("/api/v1/bookings", {
    auth: true,
    ...(status && status !== "all" ? { query: { status } } : {}),
  });
  return result.data || [];
};

/**
 * Fetches reservation details by booking ID.
 * @param {string} reservationId
 * @returns {Promise<object>}
 */
export const getReservation = async (reservationId) => {
  const result = await api.get(`/api/v1/bookings/${reservationId}`, {
    auth: true,
  });
  return result.data;
};

/**
 * Creates a new reservation / stay, uploading any identity documents.
 * @param {object} data
 * @returns {Promise<object>}
 */
export const createReservation = async (data) => {
  const documents = [];

  if (data.files?.length > 0) {
    const uploads = await getDocumentUploadUrls(
      data.files.map((file, index) => ({
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        docType: data.docTypes?.[index] || null,
      })),
    );

    await Promise.all(
      uploads.map((upload, index) =>
        uploadToR2(upload.uploadUrl, data.files[index]),
      ),
    );

    documents.push(
      ...uploads.map((upload, index) => ({
        key: upload.key,
        filename: upload.filename,
        docType: upload.docType || data.docTypes?.[index] || null,
        mimeType: upload.mimeType,
        size: upload.size,
      })),
    );
  }

  const body = {
    name: data.name,
    email: data.email,
    phone: data.phone || "",
    address: data.address || "",
    idType: data.idType || "Aadhaar",
    idNumber: data.idNumber || "",
    roomId: data.roomId,
    checkIn: data.checkIn || "",
    checkOut: data.checkOut,
    status: data.status || "reserved",
    purpose: data.purpose || "",
  };

  if (documents.length > 0) {
    body.documents = documents;
  }

  const result = await api.post("/api/v1/bookings", body, { auth: true });
  return result.data;
};

/**
 * Updates reservation parameters (status, room, checkIn, checkOut).
 * @param {string} reservationId
 * @param {object} updates
 * @returns {Promise<object>}
 */
export const updateReservation = async (reservationId, updates) => {
  const result = await api.patch(`/api/v1/bookings/${reservationId}`, updates, {
    auth: true,
  });
  return result.data;
};

/**
 * Cancels or deletes a reservation.
 * @param {string} reservationId
 * @returns {Promise<object>}
 */
export const deleteReservation = async (reservationId) => {
  return api.delete(`/api/v1/bookings/${reservationId}`, { auth: true });
};
