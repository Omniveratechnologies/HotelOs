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

export const setAuth = ({ token, user }) => {
  if (token) {
    localStorage.setItem("auth_token", token);
  }

  if (user) {
    localStorage.setItem("auth_user", JSON.stringify(user));
  }
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
  // ONLY SUB ADMINS CAN ACCESS THIS DASHBOARD
  // =================================================

  if (result.data?.user?.role !== "SUB_ADMIN") {
    throw new Error("This account does not have sub admin access.");
  }

  setAuth({ token: result.data.token, user: result.data.user });

  return result.data.user;
};

// =====================================================
// FORGOT USERNAME / PASSWORD
// =====================================================

export const forgotUsername = async (email) => {
  return recoveryRequest("/api/v1/auth/forgot-username", email);
};

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

// =====================================================
// RESET PASSWORD
// =====================================================

export const resetPassword = async ({ token, password }) => {
  if (!token) {
    throw new Error("This password reset link is invalid or missing.");
  }

  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const result = await api.post("/api/v1/auth/reset-password", {
    token,
    password,
  });

  return result.message || "Your password has been reset successfully.";
};
