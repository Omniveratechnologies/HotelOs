import { api } from "../apiFetch.js";

/**
 * Fetches hotel team members by role.
 * @param {string} [role="RECEPTIONIST"]
 * @returns {Promise<Array<object>>}
 */
export const fetchMembers = async (role = "RECEPTIONIST") => {
  const result = await api.get("/api/v1/users", {
    auth: true,
    query: { role },
  });
  return result.data || [];
};

/**
 * Removes a team member user account.
 * @param {string} memberId
 * @returns {Promise<object>}
 */
export const deleteMember = async (memberId) => {
  if (!memberId) {
    throw new Error("Member id is required.");
  }
  return api.delete(`/api/v1/users/${memberId}`, { auth: true });
};
