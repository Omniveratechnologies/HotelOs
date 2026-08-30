import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");

    const existingAdmin = await User.findOne({
      role: "SUPER_ADMIN",
    });

    if (existingAdmin) {
      console.log("Super Admin already exists:", existingAdmin.username);
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
    console.log("Super Admin created successfully!");
    console.log("Username:", superAdmin.username);
    console.log("Email:", superAdmin.email);

    process.exit(0);
  } catch (error) {
    console.error("Failed to create Super Admin:", error);
    process.exit(1);
  }
};

createSuperAdmin();
