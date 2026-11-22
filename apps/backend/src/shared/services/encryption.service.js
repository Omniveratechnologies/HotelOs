import crypto from "node:crypto";
import { env } from "#/config/env.js";
import logger from "#/utils/logger.js";

/**
 * Encryption Service for PII at Rest
 * Uses AES-256-GCM for authenticated encryption
 */

// Encryption configuration
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 16; // 128 bits

// Derive encryption key from environment secret
function getEncryptionKey() {
  const masterSecret = env.jwtSecret || process.env.ENCRYPTION_MASTER_KEY;

  if (!masterSecret) {
    throw new Error(
      "Encryption master key not configured (JWT_SECRET or ENCRYPTION_MASTER_KEY)",
    );
  }

  // Use PBKDF2 to derive a consistent key
  return crypto.pbkdf2Sync(
    masterSecret,
    "hotelos-pii-encryption",
    100000,
    KEY_LENGTH,
    "sha256",
  );
}

const ENCRYPTION_KEY = getEncryptionKey();

/**
 * Encrypt sensitive data
 * @param {string} plaintext - Data to encrypt
 * @returns {string} Encrypted data as base64 string (includes IV, auth tag, and ciphertext)
 */
export function encrypt(plaintext) {
  if (!plaintext) return plaintext;

  try {
    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    // Encrypt
    let ciphertext = cipher.update(plaintext, "utf8");
    ciphertext = Buffer.concat([ciphertext, cipher.final()]);

    // Get auth tag
    const authTag = cipher.getAuthTag();

    // Combine: IV + AuthTag + Ciphertext
    const combined = Buffer.concat([iv, authTag, ciphertext]);

    return combined.toString("base64");
  } catch (error) {
    logger.error({ error: error.message }, "Encryption failed");
    throw new Error("Encryption failed", { cause: error });
  }
}

/**
 * Decrypt sensitive data
 * @param {string} encryptedBase64 - Base64 encoded encrypted data
 * @returns {string} Decrypted plaintext
 */
export function decrypt(encryptedBase64) {
  if (!encryptedBase64) return encryptedBase64;

  try {
    const combined = Buffer.from(encryptedBase64, "base64");

    // Extract components
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const ciphertext = combined.subarray(IV_LENGTH + TAG_LENGTH);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let plaintext = decipher.update(ciphertext);
    plaintext = Buffer.concat([plaintext, decipher.final()]);

    return plaintext.toString("utf8");
  } catch (error) {
    logger.error({ error: error.message }, "Decryption failed");
    throw new Error("Decryption failed", { cause: error });
  }
}

/**
 * Encrypt an object's sensitive fields
 * @param {object} obj - Object to encrypt
 * @param {string[]} fields - Field names to encrypt
 * @returns {object} Object with encrypted fields
 */
export function encryptFields(obj, fields) {
  if (!obj || typeof obj !== "object") return obj;

  const result = { ...obj };
  for (const field of fields) {
    if (result[field] !== undefined && result[field] !== null) {
      result[field] = encrypt(String(result[field]));
    }
  }
  return result;
}

/**
 * Decrypt an object's sensitive fields
 * @param {object} obj - Object to decrypt
 * @param {string[]} fields - Field names to decrypt
 * @returns {object} Object with decrypted fields
 */
export function decryptFields(obj, fields) {
  if (!obj || typeof obj !== "object") return obj;

  const result = { ...obj };
  for (const field of fields) {
    if (result[field] !== undefined && result[field] !== null) {
      try {
        result[field] = decrypt(result[field]);
      } catch {
        // If decryption fails, leave as-is (might be unencrypted legacy data)
        logger.warn({ field }, "Failed to decrypt field, leaving as-is");
      }
    }
  }
  return result;
}

/**
 * Hash sensitive data for indexing/searching (one-way)
 * @param {string} data - Data to hash
 * @returns {string} SHA-256 hash
 */
export function hashForIndex(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Generate a secure random token
 * @param {number} length - Token length in bytes
 * @returns {string} Hex encoded token
 */
export function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Constant-time string comparison
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Fields that should be encrypted in each model
 */
export const ENCRYPTED_FIELDS = {
  User: [
    "idNumber",
    "passportNumber",
    "nationalId",
    "taxId",
    "bankAccount",
    "creditCard",
  ],
  Booking: [
    "guestIdNumber",
    "guestPassportNumber",
    "specialRequests", // May contain PII
  ],
  Guest: [
    "idNumber",
    "passportNumber",
    "nationality",
    "address",
    "phone",
    "email",
  ],
  Bill: ["guestName", "guestPhone", "guestEmail", "guestAddress"],
  Payment: [
    "cardNumber",
    "cardHolderName",
    "cardExpiry",
    "cardCvv",
    "bankAccount",
    "routingNumber",
  ],
  Invoice: ["guestName", "guestAddress", "guestTaxId", "guestEmail"],
};

export default {
  encrypt,
  decrypt,
  encryptFields,
  decryptFields,
  hashForIndex,
  generateSecureToken,
  timingSafeEqual,
  ENCRYPTED_FIELDS,
};
