import { apiFetch } from "../utils/apiFetch.js";

// =====================================================
// VERIFY INVITATION
// =====================================================

export const verifyInvitation = async (token) => {
  if (!token) {
    throw new Error("Invitation token is required.");
  }

  const result = await apiFetch("/api/v1/invites/verify", {
    method: "POST",

    body: {
      token,
    },
  });

  return result.data;
};

// =====================================================
// ACCEPT INVITATION
// =====================================================

export const acceptInvitation = async ({ token, name, username, password }) => {
  if (!token) {
    throw new Error("Invitation token is required.");
  }

  if (!name?.trim() || !username?.trim() || !password) {
    throw new Error("Name, username and password are required.");
  }

  const result = await apiFetch("/api/v1/invites/accept", {
    method: "POST",

    body: {
      token,

      name: name.trim(),

      username: username.trim().toLowerCase(),

      password,
    },
  });

  return result.data;
};
