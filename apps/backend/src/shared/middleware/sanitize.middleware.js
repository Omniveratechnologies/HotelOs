/**
 * NoSQL Injection Prevention Middleware
 * Removes MongoDB query operators from request body, query, and params
 * to prevent injection attacks.
 */

import logger from "#/utils/logger.js";

const MONGO_OPERATORS = [
  "$where",
  "$ne",
  "$gt",
  "$gte",
  "$lt",
  "$lte",
  "$in",
  "$nin",
  "$all",
  "$or",
  "$and",
  "$not",
  "$nor",
  "$exists",
  "$type",
  "$expr",
  "$jsonSchema",
  "$mod",
  "$regex",
  "$text",
  "$where",
  "$elemMatch",
  "$size",
  "$bitsAllSet",
  "$bitsAnySet",
  "$bitsAllClear",
  "$bitsAnyClear",
  "$comment",
  "$meta",
  "$slice",
  "$",
  "$[]",
  "$[<identifier>]",
];

const OPERATOR_REGEX = new RegExp(
  `^(${MONGO_OPERATORS.map((op) => op.replace("$", "\\$")).join("|")})$`,
);

/**
 * Recursively sanitize an object by removing MongoDB operators
 * @param {any} obj - Object to sanitize
 * @param {string} path - Current path (for logging)
 * @returns {any} Sanitized object
 */
function sanitizeObject(obj, path = "") {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item, index) => sanitizeObject(item, `${path}[${index}]`));
  }

  // Handle plain objects
  if (typeof obj === "object" && obj.constructor === Object) {
    const sanitized = {};
    let hasRemoved = false;

    for (const [key, value] of Object.entries(obj)) {
      // Skip MongoDB operators
      if (OPERATOR_REGEX.test(key)) {
        hasRemoved = true;
        continue;
      }

      // Recursively sanitize nested objects
      sanitized[key] = sanitizeObject(value, path ? `${path}.${key}` : key);
    }

    if (hasRemoved) {
      logger.warn({ path: path || "root" }, "NoSQL injection attempt blocked");
    }

    return sanitized;
  }

  // Return primitives as-is
  return obj;
}

/**
 * Express middleware to sanitize request body, query, and params
 */
export function sanitizeRequest(req, res, next) {
  try {
    // Sanitize body
    if (req.body && typeof req.body === "object") {
      req.body = sanitizeObject(req.body, "body");
    }

    // Sanitize query
    if (req.query && typeof req.query === "object") {
      req.query = sanitizeObject(req.query, "query");
    }

    // Sanitize params
    if (req.params && typeof req.params === "object") {
      req.params = sanitizeObject(req.params, "params");
    }

    next();
  } catch {
    // If sanitization fails, log and continue (fail open for availability)
    logger.error("Sanitization error");
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
        if (OPERATOR_REGEX.test(key)) {
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
