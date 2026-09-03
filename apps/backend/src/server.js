import "dotenv/config";
import logger from "#/utils/logger.js";

logger.info("SERVER: starting");

const appModule = await import("#/app.js");
logger.info("SERVER: app.js loaded");

const dbModule = await import("#/config/db.js");
logger.info("SERVER: db.js loaded");

const app = appModule.default;
const connectDB = dbModule.default;

const PORT = process.env.PORT || 5001;

logger.info("SERVER: connecting to MongoDB...");

try {
  await connectDB();

  logger.info("SERVER: MongoDB connected");

  app.listen(PORT, () => {
    logger.info({ port: PORT }, "SERVER: running");
    logger.info(`http://localhost:${PORT}`);
  });
} catch (error) {
  logger.error(error, "SERVER ERROR");
  process.exit(1);
}
