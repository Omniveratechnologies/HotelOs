import { api } from "../apiFetch.js";

/**
 * Fetches hotel team members by query filters.
 * @param {string|object} [params="RECEPTIONIST"]
 * @returns {Promise<Array<object>>}
 */
export const fetchMembers = async (params = {}) => {
  const queryParams = typeof params === "string" ? { role: params } : params;
  const result = await api.get("/api/v1/users", {
    auth: true,
    params: queryParams,
  });
  return result.data || [];
};

/**
 * Creates a new hotel team member or staff user.
 * @param {object} data
 * @returns {Promise<object>}
 */
export const createMember = async (data) => {
  const result = await api.post("/api/v1/users", data, { auth: true });
  return result.data;
};

/**
 * Updates an existing team member.
 * @param {string} memberId
 * @param {object} data
 * @returns {Promise<object>}
 */
export const updateMember = async (memberId, data) => {
  if (!memberId) {
    throw new Error("Member id is required.");
  }
  const result = await api.put(`/api/v1/users/${memberId}`, data, {
    auth: true,
  });
  return result.data;
};

/**
 * Removes a team member user account (soft-delete by default, or permanent).
 * @param {string} memberId
 * @param {object} [options]
 * @param {boolean} [options.permanent=false]
 * @returns {Promise<object>}
 */
export const deleteMember = async (memberId, { permanent = false } = {}) => {
  if (!memberId) {
    throw new Error("Member id is required.");
  }
  return api.delete(
    `/api/v1/users/${memberId}${permanent ? "?permanent=true" : ""}`,
    { auth: true },
  );
};

/**
 * Restores a soft-deleted member account (Super Admin only).
 * @param {string} memberId
 * @param {object} [payload]
 * @param {string} [payload.newUsername]
 * @returns {Promise<object>}
 */
export const restoreMember = async (memberId, { newUsername } = {}) => {
  if (!memberId) {
    throw new Error("Member id is required.");
  }
  const result = await api.post(
    `/api/v1/users/${memberId}/restore`,
    { newUsername },
    { auth: true },
  );
  return result.data;
};

/**
 * Resets a member's password directly.
 * @param {string} memberId
 * @param {string} password
 * @returns {Promise<object>}
 */
export const resetMemberPassword = async (memberId, password) => {
  if (!memberId) {
    throw new Error("Member id is required.");
  }
  return api.post(
    `/api/v1/users/${memberId}/reset-password`,
    { password },
    { auth: true },
  );
};
