import { apiFetch } from "../api/client.js";

export const getDashboardHealth = async () => {
  return apiFetch("/api/v1/health");
};