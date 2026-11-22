import { randomUUID } from "node:crypto";
import logger from "#/utils/logger.js";

/**
 * Correlation ID Middleware
 * Generates or extracts correlation ID for request tracing
 * Adds correlation ID to response headers and logger context
 */

const CORRELATION_HEADER = "x-correlation-id";
const REQUEST_ID_HEADER = "x-request-id";

/**
 * Generate a new correlation ID
 * @returns {string}
 */
export function generateCorrelationId() {
  return randomUUID();
}

/**
 * Extract correlation ID from request headers
 * @param {object} req - Express request
 * @returns {string}
 */
export function extractCorrelationId(req) {
  // Check for incoming correlation ID (from client or upstream service)
  const incoming =
    req.headers[CORRELATION_HEADER] || req.headers[REQUEST_ID_HEADER];

  if (incoming && typeof incoming === "string" && incoming.trim()) {
    return incoming.trim();
  }

  // Generate new correlation ID
  return generateCorrelationId();
}

/**
 * Express middleware to add correlation ID to request and response
 * @returns {import("express").RequestHandler}
 */
export function correlationMiddleware() {
  return (req, res, next) => {
    const correlationId = extractCorrelationId(req);

    // Attach to request for use in controllers
    req.correlationId = correlationId;

    // Add to response headers for client-side tracing
    res.setHeader(CORRELATION_HEADER, correlationId);
    res.setHeader(REQUEST_ID_HEADER, correlationId);

    // Add to logger context for structured logging
    const originalLogger = req.log;
    if (originalLogger && originalLogger.child) {
      req.log = originalLogger.child({ correlationId });
    }

    next();
  };
}

/**
 * Get correlation ID from request
 * @param {object} req - Express request
 * @returns {string}
 */
export function getCorrelationId(req) {
  return req.correlationId || req.headers[CORRELATION_HEADER] || "unknown";
}

/**
 * Add correlation ID to logger context
 * @param {object} loggerInstance - Logger instance
 * @param {string} correlationId
 * @returns {object} Child logger with correlation ID
 */
export function addCorrelationToLogger(loggerInstance, correlationId) {
  if (loggerInstance && loggerInstance.child) {
    return loggerInstance.child({ correlationId });
  }
  return loggerInstance;
}

/**
 * Express middleware to log incoming requests with correlation ID
 * @returns {import("express").RequestHandler}
 */
export function requestLoggingMiddleware() {
  return (req, res, next) => {
    const correlationId = getCorrelationId(req);
    const startTime = Date.now();

    // Log request
    logger.info(
      {
        correlationId,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get("user-agent"),
      },
      "Incoming request",
    );

    // Log response on finish
    res.on("finish", () => {
      const duration = Date.now() - startTime;
      logger.info(
        {
          correlationId,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          durationMs: duration,
        },
        "Request completed",
      );
    });

    next();
  };
}

export default {
  correlationMiddleware,
  generateCorrelationId,
  extractCorrelationId,
  getCorrelationId,
  addCorrelationToLogger,
  requestLoggingMiddleware,
};
