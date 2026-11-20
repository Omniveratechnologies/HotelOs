import mongoose from "mongoose";
import dns from "node:dns";
import logger from "#/utils/logger.js";
import { env } from "./env.js";

const connectDB = async () => {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
  try {
    await mongoose.connect(env.mongoUri);

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
