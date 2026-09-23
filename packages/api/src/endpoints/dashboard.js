import { api } from "../apiFetch.js";

/**
 * Fetches hotel operational statistics for dashboard.
 * @returns {Promise<object>}
 */
export const getDashboardStats = async () => {
  const result = await api.get("/api/v1/dashboard/stats", { auth: true });
  return result.data;
};

/**
 * Fetches server health and system status.
 * @returns {Promise<object>}
 */
export const getDashboardHealth = async () => {
  return api.get("/api/v1/health");
};
