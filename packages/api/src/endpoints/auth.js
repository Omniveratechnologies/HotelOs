import { api } from "../apiFetch.js";

/**
 * Retrieves the stored auth token from local storage.
 * @returns {string|null}
 */
export const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
};

/**
 * Retrieves the stored user object from local storage.
 * @returns {object|null}
 */
export const getStoredUser = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("auth_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Checks whether the current session is authenticated.
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!getStoredToken();
};

/**
 * Clears stored auth tokens and user data.
 */
export const clearAuth = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
};

/**
 * Saves auth token and user data to local storage.
 * @param {string} [token]
 * @param {object} [user]
 */
export const storeAuth = (token, user) => {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("auth_token", token);
  if (user) localStorage.setItem("auth_user", JSON.stringify(user));
};

/**
 * Authenticates user credentials and stores session data.
 * @param {object} credentials
 * @param {string} credentials.username
 * @param {string} credentials.password
 * @param {string} [credentials.expectedRole]
 * @returns {Promise<object>} Authenticated user object.
 */
export const login = async ({ username, password, expectedRole }) => {
  if (!username?.trim() || !password) {
    throw new Error("Username and password are required.");
  }

  const result = await api.post("/api/v1/auth/login", {
    username: username.trim(),
    password,
  });

  const user = result.data?.user;
  const token = result.data?.token;

  if (expectedRole && user?.role !== expectedRole) {
    throw new Error(
      `This account does not have ${expectedRole.toLowerCase()} access.`,
    );
  }

  storeAuth(token, user);
  return user;
};

/**
 * Requests username recovery email.
 * @param {string} email
 * @returns {Promise<string>}
 */
export const forgotUsername = async (email) => {
  if (!email?.trim()) {
    throw new Error("Please enter your email address.");
  }
  const result = await api.post("/api/v1/auth/forgot-username", {
    email: email.trim(),
  });
  return result.message || "Please check your email.";
};

/**
 * Requests password reset email.
 * @param {string} email
 * @returns {Promise<string>}
 */
export const forgotPassword = async (email) => {
  if (!email?.trim()) {
    throw new Error("Please enter your email address.");
  }
  const result = await api.post("/api/v1/auth/forgot-password", {
    email: email.trim(),
  });
  return result.message || "Please check your email.";
};

/**
 * Resets user password using reset token.
 * @param {object} params
 * @param {string} params.token
 * @param {string} params.password
 * @returns {Promise<object>}
 */
export const resetPassword = async ({ token, password }) => {
  const result = await api.post("/api/v1/auth/reset-password", {
    token,
    password,
  });
  return result.data;
};
