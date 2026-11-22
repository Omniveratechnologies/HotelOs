import crypto from "node:crypto";
import logger from "#/utils/logger.js";

/**
 * CSRF Protection Middleware
 * Implements double-submit cookie pattern for CSRF protection
 */

const CSRF_COOKIE_NAME = "hotelos_csrf";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a new CSRF token
 * @returns {string}
 */
export function generateCsrfToken() {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

/**
 * Express middleware to add CSRF token to response cookies
 * @param {object} [options]
 * @param {boolean} [options.secure=true] - Require HTTPS in production
 * @param {string} [options.sameSite="lax"] - Cookie sameSite policy
 * @returns {import("express").RequestHandler}
 */
export function csrfCookieMiddleware(options = {}) {
  const { secure = true, sameSite = "lax" } = options;

  return (req, res, next) => {
    // Check if CSRF token cookie exists
    const cookies = parseCookies(req.headers.cookie);
    let csrfToken = cookies[CSRF_COOKIE_NAME];

    if (!csrfToken) {
      // Generate new token
      csrfToken = generateCsrfToken();
    }

    // Set cookie with CSRF token
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: true,
      secure: isProduction && secure,
      sameSite: isProduction ? "none" : sameSite,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/",
    });

    // Make token available to route handlers
    req.csrfToken = csrfToken;

    // Also set header for SPA convenience
    res.setHeader(CSRF_HEADER_NAME, csrfToken);

    next();
  };
}

/**
 * Express middleware to validate CSRF token on state-changing requests
 * @param {object} [options]
 * @param {string[]} [options.exemptPaths=[]] - Paths to exempt from CSRF check
 * @returns {import("express").RequestHandler}
 */
export function csrfProtectionMiddleware(options = {}) {
  const { exemptPaths = [] } = options;

  return (req, res, next) => {
    // Only check CSRF on state-changing methods
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      return next();
    }

    // Check if path is exempt
    const path = req.path;
    if (exemptPaths.some((exempt) => path.startsWith(exempt))) {
      return next();
    }

    // Get token from header
    const headerToken = req.headers[CSRF_HEADER_NAME] || req.body?.csrf;

    // Get token from cookie
    const cookies = parseCookies(req.headers.cookie);
    const cookieToken = cookies[CSRF_COOKIE_NAME];

    if (!headerToken || !cookieToken) {
      logger.warn(
        { path: req.path, ip: req.ip, method: req.method },
        "CSRF validation failed: missing token",
      );
      return res.status(403).json({
        success: false,
        error: {
          code: "AUTH.CSRF_INVALID",
          message: "CSRF token required",
        },
      });
    }

    // Compare tokens (timing-safe comparison)
    if (!timingSafeEqual(headerToken, cookieToken)) {
      logger.warn(
        { path: req.path, ip: req.ip, method: req.method },
        "CSRF validation failed: token mismatch",
      );
      return res.status(403).json({
        success: false,
        error: {
          code: "AUTH.CSRF_INVALID",
          message: "Invalid CSRF token",
        },
      });
    }

    next();
  };
}

/**
 * Combined middleware: sets cookie + validates on state-changing requests
 * @param {object} [options]
 * @returns {import("express").RequestHandler[]}
 */
export function csrfMiddleware(options = {}) {
  return [csrfCookieMiddleware(options), csrfProtectionMiddleware(options)];
}

/**
 * Parse cookie header into object
 * @param {string|undefined} cookieHeader
 * @returns {Record<string, string>}
 */
function parseCookies(cookieHeader) {
  if (!cookieHeader || typeof cookieHeader !== "string") return {};
  const cookies = {};
  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const idx = pair.indexOf("=");
    if (idx < 0) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) {
      try {
        cookies[key] = decodeURIComponent(val);
      } catch {
        cookies[key] = val;
      }
    }
  }
  return cookies;
}

/**
 * Timing-safe string comparison
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Get CSRF token for current request (for passing to templates/frontend)
 * @param {object} req - Express request
 * @returns {string|null}
 */
export function getCsrfToken(req) {
  return req.csrfToken || req.headers[CSRF_HEADER_NAME] || null;
}

export default {
  csrfMiddleware,
  csrfCookieMiddleware,
  csrfProtectionMiddleware,
  generateCsrfToken,
  getCsrfToken,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
};
