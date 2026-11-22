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
    expectedRole: "KITCHEN",
  });

  if (result.requires2FA) {
    return {
      requires2FA: true,
      ...result.data,
    };
  }

  // =================================================
  // STRICT KITCHEN ROLE ISOLATION
  // =================================================

  if (result.data?.user?.role !== "KITCHEN") {
    throw new Error(
      "This account does not have access to the Kitchen dashboard. Only Kitchen accounts can log in.",
    );
  }

  localStorage.setItem("auth_token", result.data.token);
  localStorage.setItem("auth_user", JSON.stringify(result.data.user));

  return result.data.user;
};

export const verify2FALogin = async ({ userId, token, backupCode }) => {
  const result = await api.post("/api/v1/auth/2fa/verify-login", {
    userId,
    expectedRole: "KITCHEN",
    ...(token ? { token: token.trim() } : {}),
    ...(backupCode ? { backupCode: backupCode.trim() } : {}),
  });

  if (result.data?.user?.role !== "KITCHEN") {
    throw new Error(
      "This account does not have access to the Kitchen dashboard. Only Kitchen accounts can log in.",
    );
  }

  localStorage.setItem("auth_token", result.data.token);
  localStorage.setItem("auth_user", JSON.stringify(result.data.user));

  return result.data.user;
};

// =====================================================
// LOGOUT
// =====================================================

export const logout = () => {
  clearAuth();
};
