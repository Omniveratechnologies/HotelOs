import { api } from "../apiFetch.js";

/**
 * Fetch restaurant tables with optional filter params (e.g. hotelId).
 * @param {Object} params - { hotelId }
 */
export const getTables = async (params = {}) => {
  const result = await api.get("/api/v1/tables", {
    auth: true,
    params,
  });
  return result.data;
};
