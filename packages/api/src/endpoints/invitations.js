import { api } from "../apiFetch.js";

/**
 * Verifies the validity of an invitation token.
 * @param {string} token
 * @returns {Promise<object>}
 */
export const verifyInvitation = async (token) => {
  if (!token) {
    throw new Error("Invitation token is required.");
  }

  const result = await api.post("/api/v1/invites/verify", { token });
  return result.data;
};

/**
 * Accepts an invitation and sets account credentials.
 * @param {object} payload
 * @param {string} payload.token
 * @param {string} payload.name
 * @param {string} payload.username
 * @param {string} payload.password
 * @returns {Promise<object>}
 */
export const acceptInvitation = async ({ token, name, username, password }) => {
  if (!token) {
    throw new Error("Invitation token is required.");
  }

  if (!name?.trim() || !username?.trim() || !password) {
    throw new Error("Name, username and password are required.");
  }

  const result = await api.post("/api/v1/invites/accept", {
    token,
    name: name.trim(),
    username: username.trim().toLowerCase(),
    password,
  });

  return result.data;
};

/**
 * Sends a sub-admin invitation email.
 * @param {object} inviteData
 * @returns {Promise<object>}
 */
export const sendSubAdminInvite = async (inviteData) => {
  const result = await api.post(
    "/api/v1/invites",
    {
      name: inviteData.name,
      username: inviteData.username,
      email: inviteData.email,
      role: "SUB_ADMIN",
      hotelId: inviteData.hotelId,
      subscriptionStartDate: inviteData.subscriptionStartDate,
      subscriptionEndDate: inviteData.subscriptionEndDate,
    },
    { auth: true },
  );

  if (!result.success) {
    throw new Error(result.message || "Failed to send Sub Admin invitation");
  }

  return result.data;
};

/**
 * Sends a team member invitation.
 * @param {object} inviteData
 * @returns {Promise<object>}
 */
export const sendMemberInvitation = async (inviteData) => {
  const result = await api.post("/api/v1/invites", inviteData, { auth: true });
  return result.data;
};

/**
 * Sends an invitation for a receptionist user.
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.username
 * @returns {Promise<object>}
 */
export const sendReceptionistInvitation = async ({ name, email, username }) => {
  return sendMemberInvitation({
    name: name?.trim(),
    email: email?.trim().toLowerCase(),
    username: username?.trim().toLowerCase(),
    role: "RECEPTIONIST",
  });
};

/**
 * Fetches invitations list, optionally filtered by hotel ID.
 * @param {string} [hotelId]
 * @returns {Promise<Array<object>>}
 */
export const getInvitations = async (hotelId) => {
  const params = hotelId ? { hotelId } : {};
  const result = await api.get("/api/v1/invites", { auth: true, params });
  return result.data || [];
};

/**
 * Cancels or revokes an outstanding invitation.
 * @param {string} inviteId
 * @returns {Promise<object>}
 */
export const cancelInvitation = async (inviteId) => {
  const result = await api.delete(`/api/v1/invites/${inviteId}`, {
    auth: true,
  });
  return result.data || result;
};
