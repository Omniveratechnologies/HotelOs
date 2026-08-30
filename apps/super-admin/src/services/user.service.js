import { api } from "@hotelos/api";

export const createUser = async (userData) => {
  return api.post("/api/v1/users", userData, { auth: true });
};
