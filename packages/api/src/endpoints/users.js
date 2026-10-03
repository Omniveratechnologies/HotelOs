import { api } from "../apiFetch.js";

/**
 * Creates a new user in the system.
 * @param {object} userData
 * @returns {Promise<object>}
 */
export const createUser = async (userData) => {
  return api.post("/api/v1/users", userData, { auth: true });
};
