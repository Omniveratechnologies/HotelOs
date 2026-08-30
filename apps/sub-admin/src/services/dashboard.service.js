import { apiFetch } from "../utils/apiFetch.js";

// =====================================================
// DASHBOARD STATS
// =====================================================

export const getDashboardStats = async () => {
  const result = await apiFetch("/api/v1/dashboard/stats", {
    method: "GET",

    auth: true,
  });

  return result.data;
};
