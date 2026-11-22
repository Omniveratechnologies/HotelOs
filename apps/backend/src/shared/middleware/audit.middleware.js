import {
  logAuditEvent,
  AUDIT_EVENTS,
} from "#/shared/services/audit.service.js";
import logger from "#/utils/logger.js";

/**
 * Audit Middleware for Sensitive Operations
 * Logs audit events for state-changing requests on sensitive resources
 */

/**
 * Resource types that require audit logging
 */
export const AUDITED_RESOURCES = {
  // User management
  USERS: "users",
  INVITES: "invites",
  ROLES: "roles",

  // Hotel operations
  HOTELS: "hotels",
  ROOMS: "rooms",
  ROOM_TYPES: "room-types",
  RATE_PLANS: "rate-plans",

  // Bookings & Check-in
  BOOKINGS: "bookings",
  CHECK_INS: "check-ins",
  GUESTS: "guests",

  // Billing & Payments
  BILLING: "billing",
  INVOICES: "invoices",
  PAYMENTS: "payments",
  CORPORATE_COMPANIES: "corporate-companies",

  // Inventory & Orders
  INVENTORY: "inventory",
  ORDERS: "orders",
  FOOD_ITEMS: "food-items",
  TABLES: "tables",
  SERVICE_REQUESTS: "service-requests",

  // Staff Management
  STAFF: "staff-management",
  ATTENDANCE: "attendance",
  LEAVE: "leaveManagement",
  SHIFTS: "shift-schedule",
  HOLIDAYS: "holiday",

  // Security
  KEY_CARDS: "key-cards",
  SESSIONS: "sessions",
  KIOSKS: "kiosks",

  // Reports & Analytics
  REPORTS: "reports",
  DASHBOARD: "dashboard",
};

/**
 * Action types for audit logging
 */
export const AUDIT_ACTIONS = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
  LOGIN: "login",
  LOGOUT: "logout",
  PASSWORD_CHANGE: "password_change",
  PASSWORD_RESET: "password_reset",
  EXPORT: "export",
  IMPORT: "import",
  APPROVE: "approve",
  REJECT: "reject",
  CANCEL: "cancel",
  ASSIGN: "assign",
  UNASSIGN: "unassign",
};

/**
 * Map HTTP methods to audit actions
 */
const METHOD_TO_ACTION = {
  POST: AUDIT_ACTIONS.CREATE,
  GET: AUDIT_ACTIONS.READ,
  PUT: AUDIT_ACTIONS.UPDATE,
  PATCH: AUDIT_ACTIONS.UPDATE,
  DELETE: AUDIT_ACTIONS.DELETE,
};

/**
 * Determine if a route should be audited
 * @param {string} path - Request path
 * @param {string} method - HTTP method
 * @returns {boolean}
 */
export function shouldAudit(path, method) {
  // Always audit state-changing operations
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return true;
  }

  // Audit sensitive GET endpoints (exports, reports)
  if (method === "GET") {
    const sensitivePaths = ["/export", "/report", "/analytics", "/audit"];
    return sensitivePaths.some((p) => path.includes(p));
  }

  return false;
}

/**
 * Extract resource type from path
 * @param {string} path - Request path
 * @returns {string}
 */
function extractResourceType(path) {
  // Remove /api/v1/ prefix
  const cleanPath = path.replace(/^\/api\/v1\//, "");

  // Find matching resource
  for (const [resource, pattern] of Object.entries(AUDITED_RESOURCES)) {
    if (cleanPath.startsWith(pattern)) {
      return resource;
    }
  }

  return "UNKNOWN";
}

/**
 * Extract resource ID from path
 * @param {string} path - Request path
 * @param {object} params - Route params
 * @returns {string|null}
 */
function extractResourceId(path, params) {
  // Try to get ID from route params
  if (params?.id) return params.id;

  // Try to extract from path
  const match = path.match(/\/([a-f0-9]{24})(?:\/|$)/);
  if (match) return match[1];

  return null;
}

/**
 * Create audit middleware for specific resource
 * @param {object} options
 * @param {string} options.resource - Resource type from AUDITED_RESOURCES
 * @param {string[]} options.actions - Actions to audit (default: all state-changing)
 * @param {boolean} options.includeBody - Include request body in audit details
 * @returns {import("express").RequestHandler}
 */
export function createAuditMiddleware(options = {}) {
  const {
    resource,
    actions = ["POST", "PUT", "PATCH", "DELETE"],
    includeBody = false,
  } = options;

  return async (req, res, next) => {
    // Only audit specified actions
    if (!actions.includes(req.method)) {
      return next();
    }

    // Store original response send to capture response
    const originalSend = res.send;
    let responseBody = null;

    res.send = function (body) {
      responseBody = body;
      return originalSend.call(this, body);
    };

    // Continue to next middleware
    next();

    // Wait for response to finish, then log audit
    res.on("finish", async () => {
      try {
        const auditResource = resource || extractResourceType(req.path);
        const action = METHOD_TO_ACTION[req.method] || req.method.toLowerCase();
        const resourceId = extractResourceId(req.path, req.params);

        // Determine success based on status code
        const success = res.statusCode >= 200 && res.statusCode < 400;

        // Build audit details
        const details = {
          path: req.path,
          method: req.method,
          statusCode: res.statusCode,
          query: req.query,
          ...(includeBody && req.body ? { body: sanitizeBody(req.body) } : {}),
          ...(responseBody
            ? { response: sanitizeBody(JSON.parse(responseBody)) }
            : {}),
        };

        // Determine event type
        const eventType = mapToAuditEvent(auditResource, action, success);

        await logAuditEvent({
          event: eventType,
          actor: {
            userId: req.user?._id,
            username: req.user?.username,
            role: req.user?.role,
            ip: req.ip,
            userAgent: req.get("user-agent"),
            correlationId: req.correlationId,
          },
          target: {
            resourceType: auditResource,
            resourceId,
            hotelId: req.user?.hotelId,
          },
          details,
          success,
          correlationId: req.correlationId,
        });
      } catch (error) {
        // Log audit failure but don't break the response
        logger.error({ error: error.message }, "Audit logging failed");
      }
    });
  };
}

/**
 * Map resource/action to audit event type
 * @param {string} resource
 * @param {string} action
 * @param {boolean} success
 * @returns {string}
 */
function mapToAuditEvent(resource, action, success) {
  const prefix = resource.toLowerCase().replace(/-/g, "_");
  const suffix = success ? "success" : "failed";

  // Special events
  if (action === "login") return AUDIT_EVENTS.LOGIN_SUCCESS;
  if (action === "logout") return AUDIT_EVENTS.LOGOUT;
  if (action === "password_change") return AUDIT_EVENTS.PASSWORD_CHANGE;
  if (action === "password_reset") return AUDIT_EVENTS.PASSWORD_RESET_SUCCESS;

  return `${prefix}.${action}.${suffix}`;
}

/**
 * Sanitize sensitive data from body/response
 * @param {object} data
 * @returns {object}
 */
function sanitizeBody(data) {
  if (!data || typeof data !== "object") return data;

  const sensitiveFields = [
    "password",
    "currentPassword",
    "newPassword",
    "confirmPassword",
    "token",
    "secret",
    "apiKey",
    "accessToken",
    "refreshToken",
    "authorization",
    "creditCard",
    "cardNumber",
    "cvv",
    "ssn",
    "passportNumber",
    "idNumber",
    "resetPasswordToken",
    "resetPasswordExpires",
    "twoFactorSecret",
    "twoFactorBackupCodes",
  ];

  const sanitized = { ...data };
  for (const field of sensitiveFields) {
    if (sanitized[field] !== undefined) {
      sanitized[field] = "[REDACTED]";
    }
  }

  return sanitized;
}

/**
 * Pre-configured audit middleware for common resources
 */
export const auditMiddleware = {
  // User management
  users: createAuditMiddleware({ resource: AUDITED_RESOURCES.USERS }),
  invites: createAuditMiddleware({ resource: AUDITED_RESOURCES.INVITES }),

  // Hotel operations
  hotels: createAuditMiddleware({ resource: AUDITED_RESOURCES.HOTELS }),
  rooms: createAuditMiddleware({ resource: AUDITED_RESOURCES.ROOMS }),
  roomTypes: createAuditMiddleware({ resource: AUDITED_RESOURCES.ROOM_TYPES }),
  ratePlans: createAuditMiddleware({ resource: AUDITED_RESOURCES.RATE_PLANS }),

  // Bookings & Check-in
  bookings: createAuditMiddleware({ resource: AUDITED_RESOURCES.BOOKINGS }),
  checkIns: createAuditMiddleware({ resource: AUDITED_RESOURCES.CHECK_INS }),
  guests: createAuditMiddleware({ resource: AUDITED_RESOURCES.GUESTS }),

  // Billing & Payments
  billing: createAuditMiddleware({
    resource: AUDITED_RESOURCES.BILLING,
    includeBody: true,
  }),
  invoices: createAuditMiddleware({
    resource: AUDITED_RESOURCES.INVOICES,
    includeBody: true,
  }),
  payments: createAuditMiddleware({
    resource: AUDITED_RESOURCES.PAYMENTS,
    includeBody: true,
  }),
  corporateCompanies: createAuditMiddleware({
    resource: AUDITED_RESOURCES.CORPORATE_COMPANIES,
    includeBody: true,
  }),

  // Inventory & Orders
  inventory: createAuditMiddleware({ resource: AUDITED_RESOURCES.INVENTORY }),
  orders: createAuditMiddleware({ resource: AUDITED_RESOURCES.ORDERS }),
  foodItems: createAuditMiddleware({ resource: AUDITED_RESOURCES.FOOD_ITEMS }),
  tables: createAuditMiddleware({ resource: AUDITED_RESOURCES.TABLES }),
  serviceRequests: createAuditMiddleware({
    resource: AUDITED_RESOURCES.SERVICE_REQUESTS,
  }),

  // Staff Management
  staff: createAuditMiddleware({ resource: AUDITED_RESOURCES.STAFF }),
  attendance: createAuditMiddleware({ resource: AUDITED_RESOURCES.ATTENDANCE }),
  leave: createAuditMiddleware({ resource: AUDITED_RESOURCES.LEAVE }),
  shifts: createAuditMiddleware({ resource: AUDITED_RESOURCES.SHIFTS }),
  holidays: createAuditMiddleware({ resource: AUDITED_RESOURCES.HOLIDAYS }),

  // Security
  keyCards: createAuditMiddleware({ resource: AUDITED_RESOURCES.KEY_CARDS }),
  sessions: createAuditMiddleware({ resource: AUDITED_RESOURCES.SESSIONS }),
  kiosks: createAuditMiddleware({ resource: AUDITED_RESOURCES.KIOSKS }),

  // Reports
  reports: createAuditMiddleware({ resource: AUDITED_RESOURCES.REPORTS }),
  dashboard: createAuditMiddleware({ resource: AUDITED_RESOURCES.DASHBOARD }),
};

export default {
  createAuditMiddleware,
  auditMiddleware,
  AUDITED_RESOURCES,
  AUDIT_ACTIONS,
  shouldAudit,
};
