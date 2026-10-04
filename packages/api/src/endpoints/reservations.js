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

/**
 * Fetches reservations with filters/pagination (Step 3 backend).
 * @param {Object} [params] - Filter object ({ status, source, otaChannel,
 *   roomType, ratePlanId, q, from, to, page, limit, sort }).
 * @returns {Promise<{ data: object[], pagination: object }>}
 */
export const getReservationsWithFilters = async (params = {}) => {
  const query = Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== "" && v !== "all",
    ),
  );
  const result = await api.get("/api/v1/bookings", { auth: true, query });
  return {
    data: result.data || [],
    pagination: result.pagination || {
      page: 1,
      limit: 50,
      total: result.data?.length || 0,
      pages: 1,
    },
  };
};

/**
 * KPI counts + tab counts + today summary for the All Reservations page.
 * @returns {Promise<object>}
 */
export const getReservationStats = async () => {
  const result = await api.get("/api/v1/bookings/stats", { auth: true });
  return result.data;
};

/**
 * Live quote (pricing + availability) for the booking summary panel.
 * @param {object} payload - { roomTypeCode | roomId, ratePlanId?, mealPlan?, rateOverride?, checkIn, checkOut, rooms?, adults?, addOns?, discount?, taxPercent? }
 * @returns {Promise<{ pricing: object, ratePlan: object|null, availability: object|null }>}
 */
export const getQuote = async (payload) => {
  const result = await api.post("/api/v1/bookings/quote", payload, {
    auth: true,
  });
  return result.data;
};

/**
 * Per-room-type availability for a date range.
 * @param {{ checkIn: string, checkOut: string }} params
 * @returns {Promise<Array<{ roomTypeCode: string, name: string, totalRooms: number, heldUnits: number, available: number }>>}
 */
export const getAvailability = async ({ checkIn, checkOut }) => {
  const result = await api.get("/api/v1/bookings/availability", {
    auth: true,
    query: { checkIn, checkOut },
  });
  return result.data || [];
};

/**
 * Cancels a reservation (reason required; returns cancellation charge + policy note).
 * @param {string} reservationId
 * @param {{ reason: string }} payload
 */
export const cancelReservation = async (reservationId, payload) => {
  const result = await api.post(
    `/api/v1/bookings/${reservationId}/cancel`,
    payload,
    { auth: true },
  );
  return result.data;
};

/**
 * Reconfirms a draft/pending/cancelled/no-show reservation.
 * @param {string} reservationId
 */
export const reconfirmReservation = async (reservationId) => {
  const result = await api.post(
    `/api/v1/bookings/${reservationId}/reconfirm`,
    {},
    { auth: true },
  );
  return result.data;
};

/**
 * Assigns/moves a reservation to a specific room.
 * @param {string} reservationId
 * @param {{ roomId: string, note?: string }} payload
 */
export const changeReservationRoom = async (reservationId, payload) => {
  const result = await api.post(
    `/api/v1/bookings/${reservationId}/change-room`,
    payload,
    { auth: true },
  );
  return result.data;
};

/**
 * Extends a stay to a new check-out date (re-priced server-side).
 * @param {string} reservationId
 * @param {{ checkOut: string, rateOverride?: number }} payload
 */
export const extendReservationStay = async (reservationId, payload) => {
  const result = await api.post(
    `/api/v1/bookings/${reservationId}/extend-stay`,
    payload,
    { auth: true },
  );
  return result.data;
};

/**
 * Fetches the audit trail of a reservation.
 * @param {string} reservationId
 */
export const getReservationHistory = async (reservationId) => {
  const result = await api.get(`/api/v1/bookings/${reservationId}/history`, {
    auth: true,
  });
  return result.data;
};

/**
 * Lightweight guest lookup for the "Existing Guest" flow.
 * @param {string} q
 * @returns {Promise<object[]>}
 */
export const searchGuests = async (q) => {
  const result = await api.get("/api/v1/guests/search", {
    auth: true,
    query: { q },
  });
  return result.data || [];
};
