import { Redis } from "ioredis";
import env from "./env.js";
import logger from "#/utils/logger.js";

/**
 * Shared Redis connection instance configured for BullMQ.
 * BullMQ requires `maxRetriesPerRequest: null`.
 */
export const redisConnection = new Redis(env.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 3000);
    return delay;
  },
});

redisConnection.on("connect", () => {
  logger.info("Connected to Redis");
});

redisConnection.on("error", (error) => {
  logger.error({ error: error?.message || error }, "Redis connection error");
});

export default redisConnection;
