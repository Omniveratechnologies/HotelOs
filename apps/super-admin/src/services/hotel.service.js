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
