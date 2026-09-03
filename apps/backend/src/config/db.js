import mongoose from "mongoose";
import dns from "node:dns";
import logger from "#/utils/logger.js";

const connectDB = async () => {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error(error, "MongoDB connection failed");
    process.exit(1);
  }
};

export default connectDB;
