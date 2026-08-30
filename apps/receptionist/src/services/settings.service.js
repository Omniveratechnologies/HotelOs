import { apiFetch } from "../utils/apiFetch.js";

export const getMyHotel = async () => {
  const result = await apiFetch("/api/v1/hotels/me", {
    method: "GET",
    auth: true,
  });

  return result.data || null;
};

export const updateMyHotel = async (updates) => {
  const result = await apiFetch("/api/v1/hotels/me", {
    method: "PATCH",
    auth: true,
    body: updates,
  });

  return result.data;
};

export const getHotelStaff = async () => {
  const result = await apiFetch("/api/v1/users", {
    method: "GET",
    auth: true,
  });

  const data = result.data || [];

  return data.filter((u) => u.role === "RECEPTIONIST" || u.role === "KITCHEN");
};
