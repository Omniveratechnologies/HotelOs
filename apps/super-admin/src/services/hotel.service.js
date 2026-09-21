import { api } from "@hotelos/api";

// =====================================================
// GET ALL HOTELS
// =====================================================

export async function getHotels() {
  const result = await api.get("/api/v1/hotels", { auth: true });

  return result.data;
}

// =====================================================
// GET ONE HOTEL
// =====================================================

export async function getHotelById(hotelId) {
  const result = await api.get(`/api/v1/hotels/${hotelId}`, { auth: true });

  return result.data;
}

// =====================================================
// CREATE HOTEL
// =====================================================

export async function createNewHotel(hotelData) {
  const result = await api.post("/api/v1/hotels", hotelData, { auth: true });

  return result.data;
}

// Backward-compatible export
export async function createHotelData(hotelData) {
  return createNewHotel(hotelData);
}

// =====================================================
// UPDATE HOTEL
// =====================================================

export async function updateHotelDetails(hotelId, hotelData) {
  const result = await api.patch(`/api/v1/hotels/${hotelId}`, hotelData, {
    auth: true,
  });

  return result.data;
}

// =====================================================
// UPDATE HOTEL STATUS
// =====================================================

export async function updateHotelStatus(hotelId, status) {
  const result = await api.patch(
    `/api/v1/hotels/${hotelId}/status`,
    { status },
    { auth: true },
  );

  return result.data;
}

// =====================================================
// UPDATE HOTEL CREDENTIALS
// =====================================================

export async function updateHotelCredentials(hotelId, { email, password }) {
  return api.patch(
    `/api/v1/hotels/${hotelId}/credentials`,
    { email, password },
    { auth: true },
  );
}

// =====================================================
// HOTEL INVITATION
// =====================================================

export async function inviteHotelAdmin(hotelId, email) {
  return api.post(
    `/api/v1/hotels/${hotelId}/invite`,
    { email },
    { auth: true },
  );
}

// =====================================================
// SEND SUB ADMIN INVITATION
// =====================================================

export async function sendSubAdminInvite(inviteData) {
  const result = await api.post(
    "/api/v1/invites",
    {
      name: inviteData.name,
      username: inviteData.username,
      email: inviteData.email,
      role: "SUB_ADMIN",
      hotelId: inviteData.hotelId,
      subscriptionStartDate: inviteData.subscriptionStartDate,
      subscriptionEndDate: inviteData.subscriptionEndDate,
    },
    { auth: true },
  );

  if (!result.success) {
    throw new Error(result.message || "Failed to send Sub Admin invitation");
  }

  return result.data;
}

// =====================================================
// DELETE HOTEL
// =====================================================

export async function removeHotel(hotelId) {
  await api.delete(`/api/v1/hotels/${hotelId}`, { auth: true });
}

// =====================================================
// CHANNEL CODE APPROVALS (Aiosell sync workflow)
// =====================================================

export async function getChannelApprovals({ kind, status } = {}) {
  const params = new URLSearchParams();
  if (kind) params.set("kind", kind);
  if (status) params.set("status", status);
  const query = params.toString();

  const result = await api.get(
    `/api/v1/hotels/channel-approvals${query ? `?${query}` : ""}`,
    { auth: true },
  );

  return result.data;
}

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

export async function getChannelManagerConfig() {
  const result = await api.get("/api/v1/hotels/channel-manager/config", {
    auth: true,
  });

  return result.data;
}

export async function updateChannelManagerConfig(payload) {
  const result = await api.post(
    "/api/v1/hotels/channel-manager/config",
    payload,
    { auth: true },
  );

  return result.data;
}

// =====================================================
// HOTEL AIOSELL PROPERTY CODE
// =====================================================

export async function setHotelAiosellCode(hotelId, aiosellHotelCode) {
  const result = await api.patch(
    `/api/v1/hotels/${hotelId}/aiosell-code`,
    { aiosellHotelCode },
    { auth: true },
  );

  return result.data;
}

// =====================================================
// SYNC HOTEL FROM AIOSELL (pull property mapping,
// rebuild rooms + rate plans, push availability back)
// DESTRUCTIVE — replaces the hotel's channel-owned data.
// =====================================================

export async function syncHotelFromAiosell(hotelId) {
  const result = await api.post(
    `/api/v1/hotels/${hotelId}/sync-from-aiosell`,
    {},
    { auth: true },
  );

  return result.data;
}

// =====================================================
// AIOSELL LIVE DISTRIBUTION API (RATES, INVENTORY, RESTRICTIONS, NO-SHOW)
// =====================================================

export async function getLiveRates({ hotelId, startDate, endDate }) {
  const params = new URLSearchParams();
  if (hotelId) params.set("hotelId", hotelId);
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const result = await api.get(
    `/api/v1/channel-manager/distribution/rates?${params.toString()}`,
    { auth: true },
  );
  return result.data;
}

export async function updateLiveRates({ hotelId, updates }) {
  const result = await api.post(
    "/api/v1/channel-manager/distribution/rates",
    { hotelId, updates },
    { auth: true },
  );
  return result.data;
}

export async function updateRateRestrictions({ hotelId, updates }) {
  const result = await api.post(
    "/api/v1/channel-manager/distribution/rate-restrictions",
    { hotelId, updates },
    { auth: true },
  );
  return result.data;
}

export async function getLiveInventory({ hotelId, startDate, endDate }) {
  const params = new URLSearchParams();
  if (hotelId) params.set("hotelId", hotelId);
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const result = await api.get(
    `/api/v1/channel-manager/distribution/inventory?${params.toString()}`,
    { auth: true },
  );
  return result.data;
}

export async function updateLiveInventory({ hotelId, updates }) {
  const result = await api.post(
    "/api/v1/channel-manager/distribution/inventory",
    { hotelId, updates },
    { auth: true },
  );
  return result.data;
}

export async function updateInventoryRestrictions({ hotelId, updates }) {
  const result = await api.post(
    "/api/v1/channel-manager/distribution/inventory-restrictions",
    { hotelId, updates },
    { auth: true },
  );
  return result.data;
}

export async function markChannelNoShow({ hotelId, bookingId }) {
  const result = await api.post(
    "/api/v1/channel-manager/distribution/mark-noshow",
    { hotelId, bookingId },
    { auth: true },
  );
  return result.data;
}
