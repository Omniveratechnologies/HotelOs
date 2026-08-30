import { api } from "@hotelos/api";

// =====================================================
// DASHBOARD STATS
// =====================================================

export const getDashboardStats = async () => {
  const result = await api.get("/api/v1/dashboard/stats", { auth: true });

  return result.data;
};
