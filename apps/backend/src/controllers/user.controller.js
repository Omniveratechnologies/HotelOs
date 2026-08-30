import User from "../models/User.js";
import UserInvite from "../models/UserInvite.js";

import { ROLES } from "../constants/roles.js";

import {
  generateUsername,
  generateTemporaryPassword,
} from "../utils/generateCredentials.js";

import { userResponseDTO } from "../dto/user.dto.js";

export const createUser = async (req, res) => {
  try {
    const { name, role } = req.body || {};

    // Required fields
    if (!name || !role) {
      return res.status(400).json({
        success: false,
        message: "name and role are required",
      });
    }

    // Sub Admin can only create these users
    const allowedRoles = ["KITCHEN", "RECEPTIONIST"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

    // Get hotel from logged-in Sub Admin
    const hotelId = req.user.hotelId;

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: "Sub Admin is not assigned to a hotel",
      });
    }

    // Temporary values for now
    const hotelCode = "GRAND";

    // Generate username
    let number = 1;
    let username;

    do {
      username = generateUsername(
        hotelCode,
        role,
        String(number).padStart(3, "0"),
      );

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
      hotelId,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        ...userResponseDTO(user),
        temporaryPassword,
      },
    });
  } catch (error) {
    console.error("Create User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { role } = req.query;

    const filter = {};

    // Sub Admins only see users of their own hotel
    if (req.user.role === "SUB_ADMIN") {
      filter.hotelId = req.user.hotelId;
    }

    // Optional role filter (e.g. ?role=RECEPTIONIST)
    if (role) {
      if (!Object.values(ROLES).includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role filter",
        });
      }

      filter.role = role;
    }

    const users = await User.find(filter).select("-password");

    return res.status(200).json({
      success: true,
      data: users.map(userResponseDTO),
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

// =====================================================
// DELETE USER
// =====================================================

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User id is required",
      });
    }

    const target = await User.findById(id);

    if (!target) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Super Admin accounts cannot be deleted through this endpoint
    if (target.role === "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Super Admin accounts cannot be deleted",
      });
    }

    // Sub Admins can only delete staff of their own hotel
    if (req.user.role === "SUB_ADMIN") {
      if (
        !req.user.hotelId ||
        String(target.hotelId) !== String(req.user.hotelId)
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only delete users belonging to your hotel",
        });
      }

      if (!["RECEPTIONIST", "KITCHEN"].includes(target.role)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to delete this user",
        });
      }
    }

    // Clean up any pending invites tied to this user
    await UserInvite.deleteMany({ userId: target._id });

    await target.deleteOne();

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};
