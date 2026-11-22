import { env } from "#/config/env.js";
import logger from "#/utils/logger.js";
import { createServer } from "node:http";
import { initSocket } from "#/config/socket.js";
import mongoose from "mongoose";
import { redisConnection } from "#/config/redis.js";

logger.info("SERVER: starting");

const appModule = await import("#/app.js");
logger.info("SERVER: app.js loaded");

const dbModule = await import("#/config/db.js");
logger.info("SERVER: db.js loaded");

const app = appModule.default;
const connectDB = dbModule.default;

const PORT = env.port;
const HOST = env.host;

logger.info("SERVER: connecting to MongoDB...");

let httpServer;

const gracefulShutdown = async (signal) => {
  logger.info({ signal }, "SERVER: graceful shutdown initiated");

  if (httpServer) {
    await new Promise((resolve) => {
      httpServer.close(() => {
        logger.info("SERVER: HTTP server closed");
        resolve();
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.warn("SERVER: Forced HTTP server close after timeout");
        resolve();
      }, 10000);
    });
  }

  // Close MongoDB connection
  try {
    await mongoose.connection.close(false);
    logger.info("SERVER: MongoDB connection closed");
  } catch (error) {
    logger.error(error, "SERVER: Error closing MongoDB");
  }

  // Close Redis connection
  try {
    await redisConnection.quit();
    logger.info("SERVER: Redis connection closed");
  } catch (error) {
    logger.error(error, "SERVER: Error closing Redis");
  }

  logger.info("SERVER: graceful shutdown complete");
  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

try {
  await connectDB();

  logger.info("SERVER: MongoDB connected");

  httpServer = createServer(app);
  initSocket(httpServer);
  httpServer.listen(PORT, HOST, () => {
    logger.info({ port: PORT, host: HOST }, "SERVER: running");
    logger.info(`http://${HOST}:${PORT}`);
    logger.info(`http://localhost:${PORT}`);
  });
} catch (error) {
  logger.error(error, "SERVER ERROR");
  process.exit(1);
}
