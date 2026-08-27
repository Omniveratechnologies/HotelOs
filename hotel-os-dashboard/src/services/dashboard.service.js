import { apiFetch } from "../utils/apiFetch.js";

export const getDashboardStats = async () => {
  const result = await apiFetch("/api/v1/dashboard/stats", {
    method: "GET",
    auth: true,
  });

  return result.data || null;
};
