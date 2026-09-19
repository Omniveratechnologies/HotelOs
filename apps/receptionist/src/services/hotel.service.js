import { api } from "@hotelos/api";

// The room types this hotel's Aiosell property config defines. Drives the
// Room / Rate Plan dropdowns so entries always match the Aiosell conf.
export const getAiosellRoomTypes = async () => {
  const result = await api.get("/api/v1/hotels/me/aiosell-room-types", {
    auth: true,
  });

  return result.data;
};
