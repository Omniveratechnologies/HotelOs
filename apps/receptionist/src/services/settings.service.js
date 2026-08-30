import { api } from "@hotelos/api";

export const getMyHotel = async () => {
  const result = await api.get("/api/v1/hotels/me", { auth: true });

  return result.data || null;
};

export const updateMyHotel = async (updates) => {
  const result = await api.patch("/api/v1/hotels/me", updates, { auth: true });

  return result.data;
};

export const getHotelStaff = async () => {
  const result = await api.get("/api/v1/users", { auth: true });

  const data = result.data || [];

  return data.filter((u) => u.role === "RECEPTIONIST" || u.role === "KITCHEN");
};
