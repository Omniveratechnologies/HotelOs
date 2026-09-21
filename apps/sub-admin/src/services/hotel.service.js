import { api } from "@hotelos/api";

// =====================================================
// MY HOTEL
// =====================================================

export const getMyHotel = async () => {
  const result = await api.get("/api/v1/hotels/me", { auth: true });

  return result.data;
};

export const updateMyHotel = async (data) => {
  const result = await api.patch("/api/v1/hotels/me", data, { auth: true });

  return result.data;
};

// The room types this hotel's Aiosell property config defines. Drives the
// Room / Rate Plan dropdowns so entries always match the Aiosell conf.
export const getAiosellRoomTypes = async () => {
  const result = await api.get("/api/v1/hotels/me/aiosell-room-types", {
    auth: true,
  });

  return result.data;
};
