import "dotenv/config";
import mongoose from "mongoose";
import User from "#/modules/users/models/User.js";
import logger from "#/utils/logger.js";

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("MongoDB connected");

    const existingAdmin = await User.findOne({
      role: "SUPER_ADMIN",
    });

    if (existingAdmin) {
      logger.info(
        { username: existingAdmin.username },
        "Super Admin already exists",
      );
      process.exit(0);
    }

    const superAdmin = await User.create({
      name: "Super Admin",
      username: "superadmin",
      email: "contact.omnivera@gmail.com",
      password: process.env.SUPER_ADMIN_PASSWORD,
      role: "SUPER_ADMIN",
      hotelId: null,
      isActive: true,
      mustChangePassword: false,
    });
    logger.info("Super Admin created successfully!");
    logger.info({ username: superAdmin.username }, "Username");
    logger.info({ email: superAdmin.email }, "Email");

    process.exit(0);
  } catch (error) {
    logger.error(error, "Failed to create Super Admin");
    process.exit(1);
  }
};

createSuperAdmin();
