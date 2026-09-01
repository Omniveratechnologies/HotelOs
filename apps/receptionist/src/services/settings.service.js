import { api } from "@hotelos/api";

export const getMyHotel = async () => {
  const result = await api.get("/api/v1/hotels/me", { auth: true });

  return result.data || null;
};
