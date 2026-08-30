import { api } from "@hotelos/api";

// =====================================================
// AUTH STORAGE HELPERS
// =====================================================

export const getStoredToken = () => {
  return localStorage.getItem("auth_token");
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("auth_user");

    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const isAuthenticated = () => {
  return !!getStoredToken();
};

export const clearAuth = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
};

// =====================================================
// LOGIN
// =====================================================

export const login = async ({ username, password }) => {
  if (!username?.trim() || !password) {
    throw new Error("Username and password are required.");
  }

  const result = await api.post("/api/v1/auth/login", {
    username: username.trim(),
    password,
  });

  // =================================================
  // ONLY RECEPTIONISTS CAN ACCESS THE DASHBOARD
  // =================================================

  if (result.data?.user?.role !== "RECEPTIONIST") {
    throw new Error("This account does not have receptionist access.");
  }

  localStorage.setItem("auth_token", result.data.token);

  localStorage.setItem("auth_user", JSON.stringify(result.data.user));

  return result.data.user;
};

// =====================================================
// FORGOT USERNAME
// =====================================================

export const forgotUsername = async (email) => {
  return recoveryRequest("/api/v1/auth/forgot-username", email);
};

// =====================================================
// FORGOT PASSWORD
// =====================================================

export const forgotPassword = async (email) => {
  return recoveryRequest("/api/v1/auth/forgot-password", email);
};

async function recoveryRequest(endpoint, email) {
  if (!email?.trim()) {
    throw new Error("Please enter your email address.");
  }

  const result = await api.post(endpoint, { email: email.trim() });

  return result.message || "Please check your email.";
}
