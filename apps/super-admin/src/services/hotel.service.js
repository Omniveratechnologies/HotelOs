import {
  apiFetch,
  fetchHotels,
  createHotel,
  updateHotel,
  toggleHotelStatus,
  deleteHotel,
} from "../api/client.js";

// =====================================================
// GET ALL HOTELS
// =====================================================

export async function getHotels() {
  return fetchHotels();
}

// =====================================================
// CREATE HOTEL
// =====================================================

export async function createNewHotel(hotelData) {
  return createHotel(hotelData);
}

// Backward-compatible export
export async function createHotelData(hotelData) {
  return createHotel(hotelData);
}

// =====================================================
// SEND SUB ADMIN INVITATION
// =====================================================

export async function sendSubAdminInvite(inviteData) {
  const result = await apiFetch(
    "/api/v1/invites",
    {
      method: "POST",

      body: JSON.stringify({
        name: inviteData.name,
        username: inviteData.username,
        email: inviteData.email,
        role: "SUB_ADMIN",
        hotelId: inviteData.hotelId,
        subscriptionStartDate:
          inviteData.subscriptionStartDate,
        subscriptionEndDate:
          inviteData.subscriptionEndDate,
      }),
    }
  );

  if (!result.success) {
    throw new Error(
      result.message ||
        "Failed to send Sub Admin invitation"
    );
  }

  return result.data;
}

// =====================================================
// UPDATE HOTEL STATUS
// =====================================================

export async function updateHotelStatus(
  hotelId,
  status
) {
  return toggleHotelStatus(
    hotelId,
    status
  );
}

// =====================================================
// UPDATE HOTEL
// =====================================================

export async function updateHotelDetails(
  hotelId,
  hotelData
) {
  return updateHotel(
    hotelId,
    hotelData
  );
}

// =====================================================
// DELETE HOTEL
// =====================================================

export async function removeHotel(
  hotelId
) {
  return deleteHotel(hotelId);
}