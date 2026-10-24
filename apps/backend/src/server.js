import "dotenv/config";
import logger from "#/utils/logger.js";
import { createServer } from "node:http";
import { initSocket } from "#/config/socket.js";

logger.info("SERVER: starting");

const appModule = await import("#/app.js");
logger.info("SERVER: app.js loaded");

const dbModule = await import("#/config/db.js");
logger.info("SERVER: db.js loaded");

const app = appModule.default;
const connectDB = dbModule.default;

const PORT = Number(process.env.PORT) || 5001;
const HOST = process.env.HOST || "0.0.0.0";

logger.info("SERVER: connecting to MongoDB...");

try {
  await connectDB();

  logger.info("SERVER: MongoDB connected");

  const httpServer = createServer(app);
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
