const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001";

// =====================================================
// SEND RECEPTIONIST INVITATION
// =====================================================

export const sendReceptionistInvitation = async (
  email
) => {
  const token =
    localStorage.getItem("hotelOS_token");

  if (!token) {
    throw new Error(
      "You are not logged in. Please login again."
    );
  }

  const normalizedEmail = email
    ?.trim()
    .toLowerCase();

  if (!normalizedEmail) {
    throw new Error(
      "Receptionist email is required."
    );
  }

  const response = await fetch(
    `${API_URL}/api/v1/invites`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${token}`,
      },

      body: JSON.stringify({
        email: normalizedEmail,
        role: "RECEPTIONIST",
      }),
    }
  );

  let result;

  try {
    result =
      await response.json();
  } catch {
    throw new Error(
      "Invalid response from the server."
    );
  }

  if (
    !response.ok ||
    !result.success
  ) {
    throw new Error(
      result.message ||
        "Failed to send receptionist invitation"
    );
  }

  return result.data;
};

// =====================================================
// VERIFY INVITATION
// =====================================================

export const verifyInvitation = async (
  token
) => {
  if (!token) {
    throw new Error(
      "Invitation token is required."
    );
  }

  const response = await fetch(
    `${API_URL}/api/v1/invites/verify`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        token,
      }),
    }
  );

  let result;

  try {
    result =
      await response.json();
  } catch {
    throw new Error(
      "Invalid response from the server."
    );
  }

  if (
    !response.ok ||
    !result.success
  ) {
    throw new Error(
      result.message ||
        "Invalid or expired invitation"
    );
  }

  return result.data;
};

// =====================================================
// ACCEPT INVITATION
// =====================================================

export const acceptInvitation = async ({
  token,
  name,
  username,
  password,
}) => {
  if (!token) {
    throw new Error(
      "Invitation token is required."
    );
  }

  if (
    !name?.trim() ||
    !username?.trim() ||
    !password
  ) {
    throw new Error(
      "Name, username and password are required."
    );
  }

  const response = await fetch(
    `${API_URL}/api/v1/invites/accept`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        token,

        name:
          name.trim(),

        username:
          username
            .trim()
            .toLowerCase(),

        password,
      }),
    }
  );

  let result;

  try {
    result =
      await response.json();
  } catch {
    throw new Error(
      "Invalid response from the server."
    );
  }

  if (
    !response.ok ||
    !result.success
  ) {
    throw new Error(
      result.message ||
        "Failed to create account"
    );
  }

  return result.data;
};