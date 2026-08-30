import { apiFetch } from "../api/client.js";

export const createUser = async (userData) => {
  return apiFetch("/api/v1/users", {
    method: "POST",
    body: JSON.stringify(userData),
  });
};
