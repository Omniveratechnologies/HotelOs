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

  // If 2FA is required, return challenge payload without storing tokens
  if (result.requires2FA) {
    return {
      requires2FA: true,
      ...result.data,
    };
  }

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
 * Completes login verification using 2FA TOTP token or single-use backup code.
 * @param {object} params
 * @param {string} params.userId
 * @param {string} [params.token] - 6-digit TOTP code
 * @param {string} [params.backupCode] - Emergency backup code
 * @param {string} [params.expectedRole]
 * @returns {Promise<object>} Authenticated user object.
 */
export const verify2FALogin = async ({
  userId,
  token,
  backupCode,
  expectedRole,
}) => {
  if (!userId) {
    throw new Error("User ID is required.");
  }
  if (!token && !backupCode) {
    throw new Error("Verification code or backup code is required.");
  }

  const result = await api.post("/api/v1/auth/2fa/verify-login", {
    userId,
    ...(token ? { token: token.trim() } : {}),
    ...(backupCode ? { backupCode: backupCode.trim() } : {}),
  });

  const user = result.data?.user;
  const authToken = result.data?.token;

  if (expectedRole && user?.role !== expectedRole) {
    throw new Error(
      `This account does not have ${expectedRole.toLowerCase()} access.`,
    );
  }

  storeAuth(authToken, user);
  return user;
};

/**
 * Fetches current user's 2FA status and remaining backup codes count.
 * @returns {Promise<{ enabled: boolean, required: boolean, backupCodesRemaining: number }>}
 */
export const get2FAStatus = async () => {
  const result = await api.get("/api/v1/auth/2fa/status", { auth: true });
  return result.data;
};

/**
 * Initiates 2FA setup and returns QR code url, manual key, and backup codes.
 * @returns {Promise<{ secret: string, qrCodeUrl: string, backupCodes: string[], manualEntryKey: string }>}
 */
export const setup2FA = async () => {
  const result = await api.post("/api/v1/auth/2fa/setup", {}, { auth: true });
  return result.data;
};

/**
 * Verifies TOTP token to activate 2FA for the current user.
 * @param {string} token - 6-digit TOTP code
 * @returns {Promise<object>}
 */
export const verify2FASetup = async (token) => {
  if (!token?.trim()) {
    throw new Error("Verification code is required.");
  }
  const result = await api.post(
    "/api/v1/auth/2fa/setup/verify",
    { token: token.trim() },
    { auth: true },
  );
  return result.data;
};

/**
 * Disables 2FA for the current user.
 * @param {object} params
 * @param {string} [params.password]
 * @param {string} [params.token]
 * @param {string} [params.backupCode]
 * @returns {Promise<object>}
 */
export const disable2FA = async ({ password, token, backupCode } = {}) => {
  const payload = {};
  if (password) payload.password = password;
  if (token) payload.token = token.trim();
  if (backupCode) payload.backupCode = backupCode.trim();

  const result = await api.post("/api/v1/auth/2fa/disable", payload, {
    auth: true,
  });
  return result.data;
};

/**
 * Regenerates 10 single-use emergency backup codes.
 * @param {object} params
 * @param {string} [params.password]
 * @param {string} [params.token]
 * @param {string} [params.backupCode]
 * @returns {Promise<{ backupCodes: string[] }>}
 */
export const regenerateBackupCodes = async ({
  password,
  token,
  backupCode,
} = {}) => {
  const payload = {};
  if (password) payload.password = password;
  if (token) payload.token = token.trim();
  if (backupCode) payload.backupCode = backupCode.trim();

  const result = await api.post(
    "/api/v1/auth/2fa/backup-codes/regenerate",
    payload,
    { auth: true },
  );
  return result.data;
};

/**
 * Requests username recovery email.
 * @param {string|object} input - Email address or object { email, portal }
 * @param {string} [portal] - Dashboard portal (e.g. "SUB_ADMIN", "SUPER_ADMIN", "RECEPTIONIST")
 * @returns {Promise<string>}
 */
export const forgotUsername = async (input, portal) => {
  const payload =
    typeof input === "object" && input !== null
      ? { email: input.email?.trim(), portal: input.portal || portal }
      : { email: input?.trim(), portal };

  if (!payload.email) {
    throw new Error("Please enter your email address.");
  }
  const result = await api.post("/api/v1/auth/forgot-username", payload);
  return result.message || "Please check your email.";
};

/**
 * Requests password reset email.
 * @param {string|object} input - Identifier/email or object { identifier, email, portal }
 * @param {string} [portal] - Dashboard portal (e.g. "SUB_ADMIN", "SUPER_ADMIN", "RECEPTIONIST")
 * @returns {Promise<string>}
 */
export const forgotPassword = async (input, portal) => {
  const payload =
    typeof input === "object" && input !== null
      ? {
          identifier: (input.identifier || input.email)?.trim(),
          portal: input.portal || portal,
        }
      : {
          identifier: input?.trim(),
          portal,
        };

  if (!payload.identifier) {
    throw new Error("Please enter your email or username.");
  }
  const result = await api.post("/api/v1/auth/forgot-password", payload);
  return result.message || "Please check your email.";
};

/**
 * Retrieves accounts associated with an account selection token.
 * @param {string} token - 15-minute selection token from email
 * @returns {Promise<{ accounts: Array<{ username: string, name: string, hotelName: string }>, portal: string }>}
 */
export const getResetPasswordAccounts = async (token) => {
  if (!token?.trim()) {
    throw new Error("Selection token is required.");
  }
  const result = await api.get(
    `/api/v1/auth/reset-password/accounts?token=${encodeURIComponent(token.trim())}`,
  );
  return result.data;
};

/**
 * Selects an account to issue a password reset token.
 * @param {object} params
 * @param {string} params.token - Selection token
 * @param {string} params.username - Selected account username
 * @returns {Promise<{ resetToken: string }>}
 */
export const selectResetPasswordAccount = async ({ token, username }) => {
  if (!token?.trim() || !username?.trim()) {
    throw new Error("Token and username are required.");
  }
  const result = await api.post("/api/v1/auth/reset-password/select-account", {
    token: token.trim(),
    username: username.trim(),
  });
  return result.data;
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
