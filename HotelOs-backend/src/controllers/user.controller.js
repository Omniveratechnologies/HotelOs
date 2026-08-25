import User from "../models/User.js";

import {
  generateUsername,
  generateTemporaryPassword
} from "../utils/generateCredentials.js";

import { userResponseDTO } from "../dto/user.dto.js";

export const createUser = async (req, res) => {
  try {
    const { name, role } = req.body || {};

    // Required fields
    if (!name || !role) {
      return res.status(400).json({
        success: false,
        message: "name and role are required"
      });
    }

    // Sub Admin can only create these users
    const allowedRoles = ["KITCHEN", "RECEPTIONIST"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role"
      });
    }

    // Get hotel from logged-in Sub Admin
    const hotelId = req.user.hotelId;

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: "Sub Admin is not assigned to a hotel"
      });
    }

    // Temporary values for now
    const hotelCode = "GRAND";

    // Generate username
    let number = 1;
    let username;

    do {
      username = generateUsername(hotelCode, role, String(number).padStart(3, "0"));

      const existingUser = await User.findOne({ username });

      if (!existingUser) {
        break;
      }

      number++;
    } while (number <= 999);

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();

    // Create user
    const user = await User.create({
      name,
      username,
      password: temporaryPassword,
      role,
      hotelId
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        ...userResponseDTO(user),
        temporaryPassword
      }
    });

  } catch (error) {
    console.error("Create User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create user"
    });
  }
};

export const getUsers = async (req, res) => {
  try {
    let users;

    if (req.user.role === "SUB_ADMIN") {
      users = await User.find({
        hotelId: req.user.hotelId
      }).select("-password");
    } else {
      users = await User.find().select("-password");
    }

    return res.status(200).json({
      success: true,
      data: users.map(userResponseDTO)
    });

  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    });
  }
};