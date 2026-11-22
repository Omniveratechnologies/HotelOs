import { api } from "../apiFetch.js";

/**
 * Fetches hotel staff by query filters.
 * @param {string|object} [params="RECEPTIONIST"]
 * @returns {Promise<Array<object>>}
 */
export const fetchStaff = async (params = {}) => {
  const queryParams = typeof params === "string" ? { role: params } : params;
  const result = await api.get("/api/v1/users", {
    auth: true,
    params: queryParams,
  });
  return result.data || [];
};

/**
 * Creates a new hotel staff user.
 * @param {object} data
 * @returns {Promise<object>}
 */
export const createStaff = async (data) => {
  const result = await api.post("/api/v1/users", data, { auth: true });
  return result.data;
};

/**
 * Updates an existing staff user.
 * @param {string} staffId
 * @param {object} data
 * @returns {Promise<object>}
 */
export const updateStaff = async (staffId, data) => {
  if (!staffId) {
    throw new Error("Staff id is required.");
  }
  const result = await api.put(`/api/v1/users/${staffId}`, data, {
    auth: true,
  });
  return result.data;
};

/**
 * Removes a staff user account (soft-delete by default, or permanent).
 * @param {string} staffId
 * @param {object} [options]
 * @param {boolean} [options.permanent=false]
 * @returns {Promise<object>}
 */
export const deleteStaff = async (staffId, { permanent = false } = {}) => {
  if (!staffId) {
    throw new Error("Staff id is required.");
  }
  return api.delete(
    `/api/v1/users/${staffId}${permanent ? "?permanent=true" : ""}`,
    { auth: true },
  );
};

/**
 * Restores a soft-deleted staff account (Super Admin only).
 * @param {string} staffId
 * @param {object} [payload]
 * @param {string} [payload.newUsername]
 * @returns {Promise<object>}
 */
export const restoreStaff = async (staffId, { newUsername } = {}) => {
  if (!staffId) {
    throw new Error("Staff id is required.");
  }
  const result = await api.post(
    `/api/v1/users/${staffId}/restore`,
    { newUsername },
    { auth: true },
  );
  return result.data;
};

/**
 * Resets a staff member's password directly.
 * @param {string} staffId
 * @param {string} password
 * @returns {Promise<object>}
 */
export const resetStaffPassword = async (staffId, password) => {
  if (!staffId) {
    throw new Error("Staff id is required.");
  }
  return api.post(
    `/api/v1/users/${staffId}/reset-password`,
    { password },
    { auth: true },
  );
};
