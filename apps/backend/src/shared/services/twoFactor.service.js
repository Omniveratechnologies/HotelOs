import speakeasy from "speakeasy";
import QRCode from "qrcode";
import logger from "#/utils/logger.js";

/**
 * Two-Factor Authentication Service
 * Uses speakeasy for TOTP (RFC 6238) and qrcode for QR code generation
 */

/**
 * Generate a new 2FA secret for a user
 * @param {string} userId - User ID
 * @param {string} username - Username (for QR code label)
 * @returns {object} Secret, QR code URL, backup codes, manual entry key
 */
export async function generateTwoFactorSecret(userId, username) {
  const secret = speakeasy.generateSecret({
    name: `HotelOS:${username}`,
    issuer: "HotelOS",
    length: 20,
  });

  // Generate backup codes (10 codes, 8 chars each, alphanumeric)
  const backupCodes = [];
  for (let i = 0; i < 10; i++) {
    backupCodes.push({
      code: generateBackupCode(),
      used: false,
      usedAt: null,
    });
  }

  // Generate QR code as data URL
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url, {
    errorCorrectionLevel: "M",
    type: "image/png",
    margin: 2,
    width: 300,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  // Manual entry key (for users who can't scan QR)
  const manualEntryKey = formatSecretForDisplay(secret.base32);

  return {
    secret: secret.base32,
    qrCodeUrl,
    backupCodes: backupCodes.map((b) => b.code),
    manualEntryKey,
    backupCodesFull: backupCodes,
  };
}

/**
 * Generate a single backup code
 * @returns {string} 8-character uppercase alphanumeric code
 */
function generateBackupCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No confusing chars (O, I, 0, 1)
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Format secret for manual entry (groups of 4)
 * @param {string} secret - Base32 secret
 * @returns {string} Formatted secret (e.g., "ABCD EFGH IJKL MNOP")
 */
function formatSecretForDisplay(secret) {
  return secret.match(/.{1,4}/g).join(" ");
}

/**
 * Verify a TOTP token
 * @param {string} token - 6-digit token from authenticator app
 * @param {string} secret - User's 2FA secret
 * @returns {boolean} Whether token is valid
 */
export function verifyToken(token, secret) {
  if (!token || !secret) return false;

  // Normalize token (remove spaces)
  const normalizedToken = token.replace(/\s/g, "");

  // Validate format (6 digits)
  if (!/^\d{6}$/.test(normalizedToken)) {
    return false;
  }

  try {
    return speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token: normalizedToken,
      window: 1, // Allow 1 step before/after for clock drift
    });
  } catch (error) {
    logger.error({ error: error.message }, "2FA token verification error");
    return false;
  }
}

/**
 * Verify a TOTP token with time-step replay prevention (RFC 6238)
 * @param {string} token - 6-digit token from authenticator app
 * @param {string} secret - User's 2FA secret
 * @param {number|null} [lastUsedStep=null] - Last consumed time-step counter
 * @returns {{ valid: boolean, verifiedStep?: number, reason?: string }}
 */
export function verifyTokenWithStep(token, secret, lastUsedStep = null) {
  if (!token || !secret) return { valid: false };

  const normalizedToken = String(token).replace(/\s/g, "");
  if (!/^\d{6}$/.test(normalizedToken)) {
    return { valid: false };
  }

  try {
    const delta = speakeasy.totp.verifyDelta({
      secret,
      encoding: "base32",
      token: normalizedToken,
      window: 1, // Allow 1 step before/after for clock drift
    });

    if (!delta) {
      return { valid: false };
    }

    const currentStep = Math.floor(Date.now() / 1000 / 30);
    const verifiedStep = currentStep + delta.delta;

    if (
      lastUsedStep !== null &&
      lastUsedStep !== undefined &&
      verifiedStep <= lastUsedStep
    ) {
      return { valid: false, verifiedStep, reason: "ALREADY_USED" };
    }

    return { valid: true, verifiedStep };
  } catch (error) {
    logger.error({ error: error.message }, "2FA token verification error");
    return { valid: false };
  }
}

/**
 * Generate new backup codes
 * @param {number} count - Number of codes to generate (default: 10)
 * @returns {Array<string>} Array of backup codes
 */
export function generateBackupCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(generateBackupCode());
  }
  return codes;
}

/**
 * Get remaining unused backup codes count
 * @param {Array} backupCodes - User's backup codes array
 * @returns {number} Count of unused codes
 */
export function getUnusedBackupCodesCount(backupCodes) {
  return backupCodes?.filter((b) => !b.used).length || 0;
}

/**
 * Check if 2FA is required for a role
 * @param {string} role - User role
 * @returns {boolean} Whether 2FA is required
 */
export function isTwoFactorRequired(role) {
  const requiredRoles = ["SUPER_ADMIN", "SUB_ADMIN", "RECEPTIONIST"];
  return requiredRoles.includes(role);
}

/**
 * Get 2FA setup instructions for frontend
 * @returns {object} Setup instructions
 */
export function getSetupInstructions() {
  return {
    recommendedApps: [
      { name: "Google Authenticator", platform: "iOS/Android" },
      { name: "Microsoft Authenticator", platform: "iOS/Android" },
      { name: "Authy", platform: "iOS/Android/Desktop" },
      { name: "1Password", platform: "iOS/Android/Desktop" },
      { name: "Bitwarden", platform: "iOS/Android/Desktop" },
    ],
    steps: [
      "Install an authenticator app on your mobile device",
      "Scan the QR code or enter the manual entry key",
      "Enter the 6-digit code from the app to verify",
      "Save your backup codes in a secure location",
    ],
    backupCodesNote:
      "Backup codes are single-use. Each code can only be used once. Store them securely - they cannot be recovered once generated.",
  };
}

export default {
  generateTwoFactorSecret,
  verifyToken,
  verifyTokenWithStep,
  generateBackupCodes,
  getUnusedBackupCodesCount,
  isTwoFactorRequired,
  getSetupInstructions,
};
