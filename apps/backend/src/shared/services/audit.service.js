import mongoose from "mongoose";
import logger from "#/utils/logger.js";

/**
 * Audit event types for authentication
 */
export const AUDIT_EVENTS = {
  // Authentication
  LOGIN_SUCCESS: "auth.login.success",
  LOGIN_FAILED: "auth.login.failed",
  LOGIN_LOCKED: "auth.login.locked",
  LOGOUT: "auth.logout",
  PASSWORD_CHANGE: "auth.password.change",
  PASSWORD_RESET_REQUEST: "auth.password.reset.request",
  PASSWORD_RESET_SUCCESS: "auth.password.reset.success",
  PASSWORD_RESET_FAILED: "auth.password.reset.failed",
  USERNAME_RECOVERY: "auth.username.recovery",

  // Account management
  USER_CREATED: "auth.user.created",
  USER_UPDATED: "auth.user.updated",
  USER_DELETED: "auth.user.deleted",
  USER_ACTIVATED: "auth.user.activated",
  USER_DEACTIVATED: "auth.user.deactivated",
  ROLE_CHANGED: "auth.user.role_changed",

  // Session
  SESSION_CREATED: "auth.session.created",
  SESSION_REVOKED: "auth.session.revoked",
  SESSION_EXPIRED: "auth.session.expired",

  // Security
  BRUTE_FORCE_DETECTED: "auth.security.brute_force",
  SUSPICIOUS_ACTIVITY: "auth.security.suspicious",
};

/**
 * Audit log schema
 */
const auditLogSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
      enum: Object.values(AUDIT_EVENTS),
      index: true,
    },

    // Actor (who performed the action)
    actor: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
      username: String,
      role: String,
      ip: String,
      userAgent: String,
    },

    // Target (what was affected)
    target: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
      username: String,
      hotelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hotel",
        index: true,
      },
    },

    // Event details
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Outcome
    success: {
      type: Boolean,
      required: true,
      default: true,
    },

    errorMessage: String,

    // Metadata
    correlationId: { type: String, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
    // TTL index - auto-delete after 2 years (compliance)
    expires: "730d",
  },
);

// Indexes for common queries
auditLogSchema.index({ "actor.userId": 1, timestamp: -1 });
auditLogSchema.index({ "target.userId": 1, timestamp: -1 });
auditLogSchema.index({ "target.hotelId": 1, timestamp: -1 });
auditLogSchema.index({ event: 1, timestamp: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

/**
 * Log an audit event
 * @param {object} params
 * @param {string} params.event - Event type from AUDIT_EVENTS
 * @param {object} [params.actor] - Actor info (userId, username, role, ip, userAgent)
 * @param {object} [params.target] - Target info (userId, username, hotelId)
 * @param {object} [params.details] - Additional event details
 * @param {boolean} [params.success=true] - Whether the action succeeded
 * @param {string} [params.errorMessage] - Error message if failed
 * @param {string} [params.correlationId] - Request correlation ID
 * @returns {Promise<void>}
 */
export async function logAuditEvent({
  event,
  actor = {},
  target = {},
  details = {},
  success = true,
  errorMessage,
  correlationId,
}) {
  try {
    const auditEntry = new AuditLog({
      event,
      actor: {
        userId: actor.userId,
        username: actor.username,
        role: actor.role,
        ip: actor.ip,
        userAgent: actor.userAgent,
      },
      target: {
        userId: target.userId,
        username: target.username,
        hotelId: target.hotelId,
      },
      details,
      success,
      errorMessage,
      correlationId,
    });

    await auditEntry.save();
  } catch (error) {
    // Log to standard logger as fallback (don't throw - audit should never break app)
    logger.error(
      {
        event,
        actor,
        target,
        details,
        success,
        error: error.message,
      },
      "Failed to write audit log",
    );
  }
}

/**
 * Get audit logs with filters
 * @param {object} filters
 * @returns {Promise<Array>}
 */
export async function getAuditLogs(filters = {}) {
  const query = {};

  if (filters.event) query.event = filters.event;
  if (filters.actorUserId) query["actor.userId"] = filters.actorUserId;
  if (filters.targetUserId) query["target.userId"] = filters.targetUserId;
  if (filters.hotelId) query["target.hotelId"] = filters.hotelId;
  if (filters.success !== undefined) query.success = filters.success;
  if (filters.fromDate || filters.toDate) {
    query.timestamp = {};
    if (filters.fromDate) query.timestamp.$gte = new Date(filters.fromDate);
    if (filters.toDate) query.timestamp.$lte = new Date(filters.toDate);
  }

  const limit = Math.min(filters.limit || 100, 500);
  const skip = filters.skip || 0;
  const sort = { timestamp: -1 };

  // eslint-disable-next-line unicorn/no-array-sort -- Mongoose query.sort(), not Array.sort()
  return AuditLog.find(query).sort(sort).skip(skip).limit(limit).lean();
}

/**
 * Get audit log statistics
 * @param {object} filters
 * @returns {Promise<object>}
 */
export async function getAuditStats(filters = {}) {
  const match = {};

  if (filters.hotelId) match["target.hotelId"] = filters.hotelId;
  if (filters.fromDate || filters.toDate) {
    match.timestamp = {};
    if (filters.fromDate) match.timestamp.$gte = new Date(filters.fromDate);
    if (filters.toDate) match.timestamp.$lte = new Date(filters.toDate);
  }

  const [total, byEvent, byOutcome, byActor] = await Promise.all([
    AuditLog.countDocuments(match),
    AuditLog.aggregate([
      { $match: match },
      { $group: { _id: "$event", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    AuditLog.aggregate([
      { $match: match },
      { $group: { _id: "$success", count: { $sum: 1 } } },
    ]),
    AuditLog.aggregate([
      { $match: match },
      { $group: { _id: "$actor.username", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  return {
    total,
    byEvent: Object.fromEntries(byEvent.map((e) => [e._id, e.count])),
    byOutcome: Object.fromEntries(byOutcome.map((e) => [e._id, e.count])),
    topActors: byActor,
  };
}

export { AuditLog, AUDIT_EVENTS as default };
