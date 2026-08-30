import { api } from "@hotelos/api";

// =====================================================
// SEND RECEPTIONIST INVITATION
// =====================================================

export const sendReceptionistInvitation = async ({ name, email, username }) => {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Receptionist email is required.");
  }

  const result = await api.post(
    "/api/v1/invites",
    {
      name: name?.trim(),
      email: normalizedEmail,
      username: username?.trim().toLowerCase(),
      role: "RECEPTIONIST",
    },
    { auth: true },
  );

  return result.data;
};

// =====================================================
// VERIFY INVITATION
// =====================================================

export const verifyInvitation = async (token) => {
  if (!token) {
    throw new Error("Invitation token is required.");
  }

  const result = await api.post("/api/v1/invites/verify", { token });

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

  const result = await api.post("/api/v1/invites/accept", {
    token,
    name: name.trim(),
    username: username.trim().toLowerCase(),
    password,
  });

  return result.data;
};
