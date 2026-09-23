import { api } from "../apiFetch.js";

// =====================================================
// SUB ADMIN / RECEPTIONIST: CURRENT HOTEL
// =====================================================

/**
 * Fetches current authenticated hotel details.
 * @returns {Promise<object>}
 */
export const getMyHotel = async () => {
  const result = await api.get("/api/v1/hotels/me", { auth: true });
  return result.data;
};

/**
 * Updates current authenticated hotel settings.
 * @param {object} data
 * @returns {Promise<object>}
 */
export const updateMyHotel = async (data) => {
  const result = await api.patch("/api/v1/hotels/me", data, { auth: true });
  return result.data;
};

/**
 * Fetches Aiosell room types mapping for current hotel.
 * @returns {Promise<Array<object>>}
 */
export const getAiosellRoomTypes = async () => {
  const result = await api.get("/api/v1/hotels/me/aiosell-room-types", {
    auth: true,
  });
  return result.data;
};

// =====================================================
// SUPER ADMIN: HOTELS MANAGEMENT
// =====================================================

/**
 * Fetches all registered hotels.
 * @returns {Promise<Array<object>>}
 */
export async function getHotels() {
  const result = await api.get("/api/v1/hotels", { auth: true });
  return result.data || [];
}

/**
 * Fetches a single hotel by ID.
 * @param {string} hotelId
 * @returns {Promise<object>}
 */
export async function getHotelById(hotelId) {
  const result = await api.get(`/api/v1/hotels/${hotelId}`, { auth: true });
  return result.data;
}

/**
 * Creates a new hotel in the system.
 * @param {object} hotelData
 * @returns {Promise<object>}
 */
export async function createNewHotel(hotelData) {
  const result = await api.post("/api/v1/hotels", hotelData, { auth: true });
  return result.data;
}

/**
 * Alias for createNewHotel.
 * @param {object} hotelData
 * @returns {Promise<object>}
 */
export async function createHotelData(hotelData) {
  return createNewHotel(hotelData);
}

/**
 * Updates details for a specific hotel.
 * @param {string} hotelId
 * @param {object} hotelData
 * @returns {Promise<object>}
 */
export async function updateHotelDetails(hotelId, hotelData) {
  const result = await api.patch(`/api/v1/hotels/${hotelId}`, hotelData, {
    auth: true,
  });
  return result.data;
}

/**
 * Updates operational status of a hotel.
 * @param {string} hotelId
 * @param {string} status
 * @returns {Promise<object>}
 */
export async function updateHotelStatus(hotelId, status) {
  const result = await api.patch(
    `/api/v1/hotels/${hotelId}/status`,
    { status },
    { auth: true },
  );
  return result.data;
}

/**
 * Updates credentials for hotel admin account.
 * @param {string} hotelId
 * @param {object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @returns {Promise<object>}
 */
export async function updateHotelCredentials(hotelId, { email, password }) {
  return api.patch(
    `/api/v1/hotels/${hotelId}/credentials`,
    { email, password },
    { auth: true },
  );
}

/**
 * Invites a new hotel administrator by email.
 * @param {string} hotelId
 * @param {string} email
 * @returns {Promise<object>}
 */
export async function inviteHotelAdmin(hotelId, email) {
  return api.post(
    `/api/v1/hotels/${hotelId}/invite`,
    { email },
    { auth: true },
  );
}

/**
 * Removes a hotel from the system.
 * @param {string} hotelId
 * @returns {Promise<object>}
 */
export async function removeHotel(hotelId) {
  return api.delete(`/api/v1/hotels/${hotelId}`, { auth: true });
}

// =====================================================
// CHANNEL CODE APPROVALS (Aiosell sync workflow)
// =====================================================

/**
 * Fetches pending or processed channel approvals for rooms and rate plans.
 * @param {object} [filters={}]
 * @param {string} [filters.kind]
 * @param {string} [filters.status]
 * @returns {Promise<Array<object>>}
 */
export async function getChannelApprovals({ kind, status } = {}) {
  const params = {};
  if (kind) params.kind = kind;
  if (status) params.status = status;

  const result = await api.get("/api/v1/hotels/channel-approvals", {
    auth: true,
    params,
  });
  return result.data || [];
}

/**
 * Marks a channel approval item as verified.
 * @param {string} approvalId
 * @returns {Promise<object>}
 */
export async function verifyChannelApproval(approvalId) {
  const result = await api.patch(
    `/api/v1/hotels/channel-approvals/${approvalId}/verify`,
    {},
    { auth: true },
  );
  return result.data;
}

// =====================================================
// CHANNEL MANAGER CONFIG (Aiosell partner credentials)
// =====================================================

/**
 * Fetches global channel manager partner configuration.
 * @returns {Promise<object>}
 */
export async function getChannelManagerConfig() {
  const result = await api.get("/api/v1/hotels/channel-manager/config", {
    auth: true,
  });
  return result.data;
}

/**
 * Updates global channel manager partner credentials and settings.
 * @param {object} payload
 * @returns {Promise<object>}
 */
export async function updateChannelManagerConfig(payload) {
  const result = await api.post(
    "/api/v1/hotels/channel-manager/config",
    payload,
    { auth: true },
  );
  return result.data;
}

// =====================================================
// HOTEL AIOSELL PROPERTY CODE & SYNC
// =====================================================

/**
 * Links a hotel to an Aiosell property identifier code.
 * @param {string} hotelId
 * @param {string} aiosellHotelCode
 * @returns {Promise<object>}
 */
export async function setHotelAiosellCode(hotelId, aiosellHotelCode) {
  const result = await api.patch(
    `/api/v1/hotels/${hotelId}/aiosell-code`,
    { aiosellHotelCode },
    { auth: true },
  );
  return result.data;
}

/**
 * Initiates synchronization of rooms and rate plans from Aiosell.
 * @param {string} hotelId
 * @returns {Promise<object>}
 */
export async function syncHotelFromAiosell(hotelId) {
  const result = await api.post(
    `/api/v1/hotels/${hotelId}/sync-from-aiosell`,
    {},
    { auth: true },
  );
  return result.data;
}

// =====================================================
// AIOSELL LIVE DISTRIBUTION API
// =====================================================

/**
 * Fetches live distribution rates for a hotel within a date range.
 * @param {object} [params={}]
 * @param {string} [params.hotelId]
 * @param {string} [params.startDate]
 * @param {string} [params.endDate]
 * @returns {Promise<object>}
 */
export async function getLiveRates({ hotelId, startDate, endDate } = {}) {
  const params = {};
  if (hotelId) params.hotelId = hotelId;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const result = await api.get("/api/v1/channel-manager/distribution/rates", {
    auth: true,
    params,
  });
  return result.data;
}

/**
 * Updates live rates distribution in Aiosell.
 * @param {object} payload
 * @param {string} payload.hotelId
 * @param {Array<object>} payload.updates
 * @returns {Promise<object>}
 */
export async function updateLiveRates({ hotelId, updates }) {
  const result = await api.post(
    "/api/v1/channel-manager/distribution/rates",
    { hotelId, updates },
    { auth: true },
  );
  return result.data;
}

/**
 * Updates rate restrictions (e.g. CTA, CTD, min-stay) in Aiosell.
 * @param {object} payload
 * @param {string} payload.hotelId
 * @param {Array<object>} payload.updates
 * @returns {Promise<object>}
 */
export async function updateRateRestrictions({ hotelId, updates }) {
  const result = await api.post(
    "/api/v1/channel-manager/distribution/rate-restrictions",
    { hotelId, updates },
    { auth: true },
  );
  return result.data;
}

/**
 * Fetches live distribution inventory counts for a hotel within a date range.
 * @param {object} [params={}]
 * @param {string} [params.hotelId]
 * @param {string} [params.startDate]
 * @param {string} [params.endDate]
 * @returns {Promise<object>}
 */
export async function getLiveInventory({ hotelId, startDate, endDate } = {}) {
  const params = {};
  if (hotelId) params.hotelId = hotelId;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const result = await api.get(
    "/api/v1/channel-manager/distribution/inventory",
    {
      auth: true,
      params,
    },
  );
  return result.data;
}

/**
 * Updates live room inventory counts in Aiosell.
 * @param {object} payload
 * @param {string} payload.hotelId
 * @param {Array<object>} payload.updates
 * @returns {Promise<object>}
 */
export async function updateLiveInventory({ hotelId, updates }) {
  const result = await api.post(
    "/api/v1/channel-manager/distribution/inventory",
    { hotelId, updates },
    { auth: true },
  );
  return result.data;
}

/**
 * Updates inventory restrictions (stop-sell) in Aiosell.
 * @param {object} payload
 * @param {string} payload.hotelId
 * @param {Array<object>} payload.updates
 * @returns {Promise<object>}
 */
export async function updateInventoryRestrictions({ hotelId, updates }) {
  const result = await api.post(
    "/api/v1/channel-manager/distribution/inventory-restrictions",
    { hotelId, updates },
    { auth: true },
  );
  return result.data;
}

/**
 * Marks a channel booking as no-show in Aiosell.
 * @param {object} payload
 * @param {string} payload.hotelId
 * @param {string} payload.bookingId
 * @returns {Promise<object>}
 */
export async function markChannelNoShow({ hotelId, bookingId }) {
  const result = await api.post(
    "/api/v1/channel-manager/distribution/mark-noshow",
    { hotelId, bookingId },
    { auth: true },
  );
  return result.data;
}
