import mongoose from "mongoose";
import dns from "node:dns";
import logger from "#/utils/logger.js";
import { env } from "./env.js";

const connectDB = async (overrideUri) => {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
  try {
    const uri = overrideUri || process.env.MONGODB_URI || env.mongoUri;

    const isTest =
      process.env.NODE_ENV === "test" ||
      process.execArgv.some((a) => a.includes("--test")) ||
      process.argv.some((a) => a.includes("--test"));

    if (isTest) {
      const isRemote =
        uri.includes("mongodb.net") ||
        uri.startsWith("mongodb+srv:") ||
        (uri.includes("cluster") &&
          !uri.includes("127.0.0.1") &&
          !uri.includes("localhost"));

      if (isRemote) {
        logger.fatal(
          { uri },
          "CRITICAL TEST SAFETY VIOLATION: Remote MongoDB Atlas connection prohibited during test runs.",
        );
        throw new Error(
          "Automated tests are strictly forbidden from connecting to remote MongoDB Atlas instances.",
        );
      }
    }

    await mongoose.connect(uri);

    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error(error, "MongoDB connection failed");
    process.exit(1);
  }
};

export const getConnectionStatus = () => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return states[mongoose.connection.readyState] || "unknown";
};

export default connectDB;
