import "#/config/env.js";
import connectDB from "#/config/db.js";
import { registerAllModels } from "#/config/models.js";
import redisConnection from "#/config/redis.js";
import { reconcileCheckInReminders } from "#/modules/check-ins/queues/checkInEmail.queue.js";
import { initCheckInReminderWorker } from "./email/checkInReminder.worker.js";
import logger from "#/utils/logger.js";

/**
 * Master Worker Process Runner.
 * Boots database connections, pre-registers domain models,
 * performs startup reconciliation, and manages the lifecycle of all registered queue workers.
 */
async function startWorkerService() {
  logger.info("Initializing HotelOS Background Worker Service...");

  // 1. Connect to MongoDB and register Mongoose schemas across all domains
  await connectDB();
  // Essential: Registers User, Hotel, Room, Booking, etc. schemas so background jobs
  // can perform Mongoose .populate() calls without triggering "Schema hasn't been registered" errors.
  registerAllModels();

  // 2. Perform Startup Reconciliation (ensures zero loss across restarts/crashes)
  await reconcileCheckInReminders();

  // 3. Register and start workers
  const activeWorkers = [];

  // Register check-in email worker
  const checkInWorker = initCheckInReminderWorker();
  activeWorkers.push(checkInWorker);

  // NOTE: Future email/background workers can be registered here:
  // e.g.:
  // const checkOutWorker = initCheckOutEmailWorker();
  // activeWorkers.push(checkOutWorker);

  logger.info(
    { workerCount: activeWorkers.length },
    "All background workers running successfully",
  );

  // 4. Graceful shutdown handler
  const handleShutdown = async (signal) => {
    logger.info({ signal }, "Shutting down background workers gracefully...");
    try {
      await Promise.all(activeWorkers.map((w) => w.close()));
      await redisConnection.quit();
      logger.info("Worker process terminated cleanly");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Error during worker shutdown");
      process.exit(1);
    }
  };

  process.on("SIGINT", () => handleShutdown("SIGINT"));
  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
}

startWorkerService().catch((err) => {
  logger.error({ err }, "Fatal error starting worker service");
  process.exit(1);
});
