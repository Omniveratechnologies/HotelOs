import { env } from "#/config/env.js";

/**
 * API Version Configuration
 */
export const API_VERSION = {
  CURRENT: "v1",
  SUPPORTED: ["v1"],
  DEPRECATED: [],
  HEADER_NAME: "api-version",
  DEPRECATION_HEADER: "deprecation",
  SUNSET_HEADER: "sunset",
};

/**
 * Get API version from request
 * Priority: Header > Query param > Default
 * @param {object} req - Express request
 * @returns {string}
 */
export function getApiVersion(req) {
  // Check header
  const headerVersion = req.headers[API_VERSION.HEADER_NAME];
  if (headerVersion && typeof headerVersion === "string") {
    const normalized = headerVersion.toLowerCase().trim();
    if (API_VERSION.SUPPORTED.includes(normalized)) {
      return normalized;
    }
  }

  // Check query parameter
  const queryVersion = req.query[API_VERSION.HEADER_NAME];
  if (queryVersion && typeof queryVersion === "string") {
    const normalized = queryVersion.toLowerCase().trim();
    if (API_VERSION.SUPPORTED.includes(normalized)) {
      return normalized;
    }
  }

  // Default to current version
  return API_VERSION.CURRENT;
}

/**
 * Express middleware to add API version headers
 * @returns {import("express").RequestHandler}
 */
export function apiVersionMiddleware() {
  return (req, res, next) => {
    const version = getApiVersion(req);

    // Set version headers
    res.setHeader(API_VERSION.HEADER_NAME, version);

    // Add deprecation warning if using deprecated version
    if (API_VERSION.DEPRECATED.includes(version)) {
      res.setHeader(
        API_VERSION.DEPRECATION_HEADER,
        `true; version="${version}"`,
      );
      // Sunset date (6 months from now)
      const sunsetDate = new Date();
      sunsetDate.setMonth(sunsetDate.getMonth() + 6);
      res.setHeader(API_VERSION.SUNSET_HEADER, sunsetDate.toUTCString());
    }

    // Add supported versions header
    res.setHeader("x-api-supported-versions", API_VERSION.SUPPORTED.join(", "));

    // Attach version to request for controller access
    req.apiVersion = version;

    next();
  };
}

/**
 * Validate API version in request
 * @param {string[]} supportedVersions
 * @returns {import("express").RequestHandler}
 */
export function validateApiVersion(supportedVersions = API_VERSION.SUPPORTED) {
  return (req, res, next) => {
    const version = getApiVersion(req);

    if (!supportedVersions.includes(version)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "API.VERSION_UNSUPPORTED",
          message: `API version '${version}' is not supported`,
          details: {
            supportedVersions,
            currentVersion: API_VERSION.CURRENT,
          },
        },
      });
    }

    next();
  };
}

/**
 * Get version info for health/version endpoints
 * @returns {object}
 */
export function getVersionInfo() {
  return {
    current: API_VERSION.CURRENT,
    supported: API_VERSION.SUPPORTED,
    deprecated: API_VERSION.DEPRECATED,
    build: {
      version: env.npm_package_version || "1.0.0",
      environment: env.nodeEnv,
      timestamp: new Date().toISOString(),
    },
  };
}

export default {
  API_VERSION,
  getApiVersion,
  apiVersionMiddleware,
  validateApiVersion,
  getVersionInfo,
};
