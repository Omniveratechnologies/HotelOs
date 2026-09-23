import { api } from "../apiFetch.js";

/**
 * Requests signed upload URLs for guest identity documents.
 * @param {Array<object>} files
 * @returns {Promise<Array<object>>}
 */
export const getDocumentUploadUrls = async (files) => {
  const result = await api.post(
    "/api/v1/guests/documents/upload-urls",
    { files },
    { auth: true },
  );
  return result.data || [];
};

/**
 * Uploads a document directly to Cloudflare R2 storage using a presigned URL.
 * @param {string} uploadUrl
 * @param {File|Blob} file
 * @returns {Promise<void>}
 */
export const uploadToR2 = async (uploadUrl, file) => {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!response.ok) {
    throw new Error("Failed to upload document");
  }
};

/**
 * Fetches bookings/guests list, optionally filtered by status.
 * @param {string} [status]
 * @returns {Promise<Array<object>>}
 */
export const getGuests = async (status) => {
  const result = await api.get("/api/v1/bookings", {
    auth: true,
    ...(status && status !== "all" ? { query: { status } } : {}),
  });
  return result.data || [];
};

/**
 * Fetches booking details by booking ID.
 * @param {string} bookingId
 * @returns {Promise<object>}
 */
export const getGuest = async (bookingId) => {
  const result = await api.get(`/api/v1/bookings/${bookingId}`, { auth: true });
  return result.data;
};

/**
 * Registers a new guest and creates a booking, uploading any identity documents.
 * @param {object} data
 * @returns {Promise<object>}
 */
export const registerGuest = async (data) => {
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
    status: data.status,
  };

  if (documents.length > 0) {
    body.documents = documents;
  }

  const result = await api.post("/api/v1/bookings", body, { auth: true });
  return result.data;
};

/**
 * Updates booking parameters (e.g. check-in, check-out, room).
 * @param {string} bookingId
 * @param {object} updates
 * @returns {Promise<object>}
 */
export const updateBooking = async (bookingId, updates) => {
  const result = await api.patch(`/api/v1/bookings/${bookingId}`, updates, {
    auth: true,
  });
  return result.data;
};

/**
 * Updates guest profile information.
 * @param {string} guestId
 * @param {object} updates
 * @returns {Promise<object>}
 */
export const updateGuest = async (guestId, updates) => {
  const result = await api.patch(`/api/v1/guests/${guestId}`, updates, {
    auth: true,
  });
  return result.data;
};

/**
 * Updates guest portal login credentials.
 * @param {string} guestId
 * @param {object} payload
 * @returns {Promise<object>}
 */
export const updateGuestCredentials = async (guestId, payload) => {
  return api.patch(`/api/v1/guests/${guestId}/credentials`, payload, {
    auth: true,
  });
};

/**
 * Deletes an uploaded guest document.
 * @param {string} guestId
 * @param {string} docId
 * @returns {Promise<object>}
 */
export const deleteGuestDocument = async (guestId, docId) => {
  return api.delete(`/api/v1/guests/${guestId}/documents/${docId}`, {
    auth: true,
  });
};

/**
 * Deletes or cancels a guest booking.
 * @param {string} bookingId
 * @returns {Promise<object>}
 */
export const deleteGuest = async (bookingId) => {
  return api.delete(`/api/v1/bookings/${bookingId}`, { auth: true });
};
