import { api } from "@hotelos/api";

// Request presigned upload URLs for a set of documents.
// files: [{ filename, size, mimeType, docType }]
export const getDocumentUploadUrls = async (files) => {
  const result = await api.post(
    "/api/v1/guests/documents/upload-urls",
    { files },
    { auth: true },
  );

  return result.data || [];
};

// Upload a single file directly to Cloudflare R2 using its presigned URL.
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

// Stays (bookings) — list / detail / create / update / delete
export const getGuests = async (status) => {
  const result = await api.get("/api/v1/bookings", {
    auth: true,
    ...(status && status !== "all" ? { query: { status } } : {}),
  });

  return result.data || [];
};

export const getGuest = async (bookingId) => {
  const result = await api.get(`/api/v1/bookings/${bookingId}`, { auth: true });

  return result.data;
};

// data: { name, email, phone, address, idType, idNumber, roomId, checkIn, checkOut, status, docTypes[], files[] }
export const registerGuest = async (data) => {
  const documents = [];

  if (data.files?.length > 0) {
    // 1. Request presigned URLs, one per file.
    const uploads = await getDocumentUploadUrls(
      data.files.map((file, index) => ({
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        docType: data.docTypes?.[index] || null,
      })),
    );

    // 2. Upload each file directly to R2.
    await Promise.all(
      uploads.map((upload, index) =>
        uploadToR2(upload.uploadUrl, data.files[index]),
      ),
    );

    // 3. Pass the uploaded object keys back as document metadata.
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

// Stay field updates (status change, room/dates) — booking id
export const updateBooking = async (bookingId, updates) => {
  const result = await api.patch(`/api/v1/bookings/${bookingId}`, updates, {
    auth: true,
  });

  return result.data;
};

// Guest profile updates (name/email/phone/address/id/ID docs) — guest user id
export const updateGuest = async (guestId, updates) => {
  const result = await api.patch(`/api/v1/guests/${guestId}`, updates, {
    auth: true,
  });

  return result.data;
};

export const updateGuestCredentials = async (guestId, payload) => {
  return api.patch(`/api/v1/guests/${guestId}/credentials`, payload, {
    auth: true,
  });
};

export const deleteGuestDocument = async (guestId, docId) => {
  return api.delete(`/api/v1/guests/${guestId}/documents/${docId}`, {
    auth: true,
  });
};

// Delete a stay (booking) — cascades the stay's own guest account, documents
// and frees the room
export const deleteGuest = async (bookingId) => {
  return api.delete(`/api/v1/bookings/${bookingId}`, { auth: true });
};
