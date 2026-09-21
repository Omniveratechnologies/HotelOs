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

  if (!result.success) {
    throw new Error(result.message || "Login failed");
  }

  const { token, user } = result.data;

  if (user?.role !== "SUPER_ADMIN") {
    throw new Error(
      "You are not authorized to access the Super Admin Dashboard.",
    );
  }

  setAuth({ token, user });

  return user;
};

export const loginSuperAdmin = async (username, password) => {
  return login({ username, password });
};

export const logoutSuperAdmin = () => {
  clearAuth();
};

export const getCurrentUser = () => {
  return getStoredUser();
};

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
