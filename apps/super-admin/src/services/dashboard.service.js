import { api } from "@hotelos/api";

export const getDashboardHealth = async () => {
  return api.get("/api/v1/health");
};
