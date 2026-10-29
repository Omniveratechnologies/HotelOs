import redisConnection from "#/config/redis.js";
import logger from "#/utils/logger.js";

const memoryStore = new Map();

// Periodic cleanup of expired in-memory entries (runs every 60s)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    if (record.resetAt <= now) {
      memoryStore.delete(key);
    }
  }
}, 60000).unref();

/**
 * Creates an Express rate-limiting middleware using Redis with memory fallback.
 *
 * @param {object} options
 * @param {string} options.prefix - Key prefix identifying the rate limiter
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum allowed requests within the window
 * @param {string} [options.message] - Custom error message
 * @param {(req: import('express').Request) => string} [options.keyGenerator] - Custom key extractor
 * @returns {import('express').RequestHandler}
 */
export function createRateLimiter({
  prefix = "rl",
  windowMs = 60000,
  max = 20,
  message = "Too many requests. Please slow down and try again shortly.",
  keyGenerator,
}) {
  const getKey =
    keyGenerator ||
    ((req) => req.ip || req.headers["x-forwarded-for"] || "anonymous");

  return async (req, res, next) => {
    const identifier = getKey(req);
    const key = `ratelimit:${prefix}:${identifier}`;
    const now = Date.now();

    // 1. Try Redis first if connected
    if (redisConnection && redisConnection.status === "ready") {
      try {
        const current = await redisConnection.incr(key);
        if (current === 1) {
          await redisConnection.pexpire(key, windowMs);
        }

        if (current > max) {
          const ttlMs = await redisConnection.pttl(key);
          res.setHeader("Retry-After", Math.ceil(Math.max(1, ttlMs) / 1000));
          return res.status(429).json({
            success: false,
            code: "RATE_LIMITED",
            message,
          });
        }
        return next();
      } catch (redisError) {
        logger.warn(
          { error: redisError.message },
          "Redis rate limiter fallback to in-memory store",
        );
      }
    }

    // 2. Fallback to in-memory store
    let record = memoryStore.get(key);
    if (!record || record.resetAt <= now) {
      record = { count: 1, resetAt: now + windowMs };
      memoryStore.set(key, record);
    } else {
      record.count += 1;
    }

    if (record.count > max) {
      const remainingSeconds = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader("Retry-After", Math.max(1, remainingSeconds));
      return res.status(429).json({
        success: false,
        code: "RATE_LIMITED",
        message,
      });
    }

    return next();
  };
}
