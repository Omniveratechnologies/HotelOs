import "dotenv/config";
import http from "node:http";
import logger from "#/utils/logger.js";
import { initRealtime } from "#/realtime/socket.js";

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

  const server = http.createServer(app);

  initRealtime(server);

  server.listen(PORT, () => {
    logger.info({ port: PORT }, "SERVER: running");
    logger.info(`http://localhost:${PORT}`);
  });
} catch (error) {
  logger.error(error, "SERVER ERROR");
  process.exit(1);
}
