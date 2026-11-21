/**
 * NoSQL Injection Prevention Middleware
 * Removes MongoDB query operators from request body, query, and params
 * to prevent injection attacks.
 */

import logger from "#/utils/logger.js";

/**
 * Recursively sanitize an object in-place by removing MongoDB query operators ($gt, $ne, etc.)
 * Express 5 defines req.query and req.params as getter properties, so modifying in-place
 * prevents "Cannot set property query of #<IncomingMessage> which has only a getter" errors.
 * @param {any} obj - Object to sanitize
 * @param {string} path - Current path (for logging)
 */
function sanitizeInPlace(obj, path = "") {
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === "object" && obj[i] !== null) {
        sanitizeInPlace(obj[i], `${path}[${i}]`);
      }
    }
    return;
  }

  // Handle plain objects (including Object.create(null))
  const proto = Object.getPrototypeOf(obj);
  if (proto === null || proto === Object.prototype) {
    let hasRemoved = false;

    for (const key of Object.keys(obj)) {
      // Skip MongoDB query operators ($gt, $ne, $where, etc.)
      if (typeof key === "string" && key.startsWith("$")) {
        delete obj[key];
        hasRemoved = true;
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        sanitizeInPlace(obj[key], path ? `${path}.${key}` : key);
      }
    }

    if (hasRemoved) {
      logger.warn({ path: path || "root" }, "NoSQL injection attempt blocked");
    }
  }
}

/**
 * Express middleware to sanitize request body, query, and params
 */
export function sanitizeRequest(req, res, next) {
  try {
    if (req.body && typeof req.body === "object") {
      sanitizeInPlace(req.body, "body");
    }

    if (req.query && typeof req.query === "object") {
      sanitizeInPlace(req.query, "query");
    }

    if (req.params && typeof req.params === "object") {
      sanitizeInPlace(req.params, "params");
    }

    next();
  } catch (err) {
    // If sanitization fails, log and continue (fail open for availability)
    logger.error({ err: err?.message || err }, "Sanitization error");
    next();
  }
}

/**
 * Strict sanitization - throws error if operators detected
 * Use for sensitive endpoints
 */
export function strictSanitizeRequest(req, res, next) {
  try {
    const checkForOperators = (obj, path = "") => {
      if (!obj || typeof obj !== "object") return;

      for (const [key, value] of Object.entries(obj)) {
        if (key.startsWith("$")) {
          throw new Error(`MongoDB operator '${key}' detected in ${path}`);
        }
        if (value && typeof value === "object") {
          checkForOperators(value, path ? `${path}.${key}` : key);
        }
      }
    };

    checkForOperators(req.body, "body");
    checkForOperators(req.query, "query");
    checkForOperators(req.params, "params");

    next();
  } catch {
    return res.status(400).json({
      success: false,
      message: "Invalid request: MongoDB operators not allowed",
      code: "NOSQL_INJECTION_BLOCKED",
    });
  }
}

export default sanitizeRequest;
