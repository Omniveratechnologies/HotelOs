import User from "../models/User.js";
import Hotel from "#/modules/hotels/models/Hotel.js";
import UserInvite from "#/modules/invites/models/UserInvite.js";
import { ROLES } from "#/shared/constants/roles.js";
import {
  generateUsername,
  generateTemporaryPassword,
} from "#/shared/utils/generateCredentials.js";
import { userResponseDTO } from "../dto/user.dto.js";
import logger from "#/utils/logger.js";

// =====================================================
// CREATE USER
// =====================================================

export const createUser = async (req, res) => {
  try {
    const {
      name,
      role,
      username: customUsername,
      password: customPassword,
      email,
      hotelId: targetHotelId,
      isActive,
    } = req.validated.body;

    // Sub Admin can only create RECEPTIONIST and KITCHEN
    if (req.user.role === "SUB_ADMIN") {
      const allowedRoles = ["KITCHEN", "RECEPTIONIST"];
      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          success: false,
          message: "Sub Admin can only create Receptionist or Kitchen users",
        });
      }
    }

    // Determine hotelId
    const hotelId =
      req.user.role === "SUB_ADMIN"
        ? req.user.hotelId
        : targetHotelId || req.user.hotelId;

    if (!hotelId && role !== "SUPER_ADMIN") {
      return res.status(400).json({
        success: false,
        message: "Hotel assignment is required for this role",
      });
    }

    // Resolve username
    let finalUsername;
    if (customUsername?.trim()) {
      finalUsername = customUsername.trim().toLowerCase();

      // Check uniqueness against existing active/all users
      const existingUser = await User.findOne({ username: finalUsername });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: `Username '${finalUsername}' is already taken`,
        });
      }
    } else {
      // Auto-generate username
      let hotelCode = "HOTEL";
      if (hotelId) {
        const hotel = await Hotel.findById(hotelId);
        if (hotel?.hotelCode) {
          hotelCode = hotel.hotelCode;
        }
      }

      let number = 1;
      do {
        finalUsername = generateUsername(
          hotelCode,
          role,
          String(number).padStart(3, "0"),
        );

        // oxlint-disable-next-line no-await-in-loop -- sequential uniqueness check
        const existingUser = await User.findOne({ username: finalUsername });
        if (!existingUser) {
          break;
        }

        number++;
      } while (number <= 999);
    }

    // Resolve password
    let finalPassword;
    let mustChangePassword = false;
    if (customPassword?.trim()) {
      finalPassword = customPassword.trim();
      mustChangePassword = false;
    } else {
      finalPassword = generateTemporaryPassword();
      mustChangePassword = true;
    }

    // Check email uniqueness if email provided
    const cleanEmail = email?.trim() ? email.trim().toLowerCase() : undefined;
    if (cleanEmail) {
      const existingEmail = await User.findOne({
        email: cleanEmail,
        isDeleted: { $ne: true },
      });
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: "Email is already registered to another active account",
        });
      }
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      username: finalUsername,
      password: finalPassword,
      role,
      hotelId: hotelId || null,
      email: cleanEmail,
      isActive: isActive !== undefined ? isActive : true,
      mustChangePassword,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        ...userResponseDTO(user),
        ...(mustChangePassword ? { temporaryPassword: finalPassword } : {}),
      },
    });
  } catch (error) {
    logger.error(error, "Create User Error");

    return res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
};

// =====================================================
// GET USERS
// =====================================================

export const getUsers = async (req, res) => {
  try {
    const { role, hotelId, search, status, includeDeleted } =
      req.validated.query;

    const filter = {};

    // Sub Admins & Receptionists only see users of their own hotel, non-deleted
    if (req.user.role === "SUB_ADMIN" || req.user.role === "RECEPTIONIST") {
      filter.hotelId = req.user.hotelId;
      filter.isDeleted = { $ne: true };

      if (status === "ACTIVE") {
        filter.isActive = true;
      } else if (status === "INACTIVE") {
        filter.isActive = false;
      }
    } else if (req.user.role === "SUPER_ADMIN") {
      // Super Admin can scope by hotelId
      if (hotelId) {
        filter.hotelId = hotelId;
      }

      // Status filters for Super Admin
      if (status === "DELETED") {
        filter.isDeleted = true;
      } else if (status === "ACTIVE") {
        filter.isDeleted = { $ne: true };
        filter.isActive = true;
      } else if (status === "INACTIVE") {
        filter.isDeleted = { $ne: true };
        filter.isActive = false;
      } else if (includeDeleted === "false" || includeDeleted === false) {
        filter.isDeleted = { $ne: true };
      }
      // If status === "ALL" or undefined, and includeDeleted is true/omitted, Super Admin sees all (active + deleted)
    }

    // Optional role filter (e.g. ?role=RECEPTIONIST)
    if (role && role !== "ALL") {
      if (!Object.values(ROLES).includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role filter",
        });
      }

      // Sub-Admins and Receptionists can only view RECEPTIONIST and KITCHEN staff
      if (req.user.role === "SUB_ADMIN" || req.user.role === "RECEPTIONIST") {
        if (![ROLES.RECEPTIONIST, ROLES.KITCHEN].includes(role)) {
          return res.status(403).json({
            success: false,
            message: "You can only view Receptionist and Kitchen staff",
          });
        }
      }

      filter.role = role;
    } else {
      if (req.user.role === "SUB_ADMIN" || req.user.role === "RECEPTIONIST") {
        // Sub-Admins and Receptionists only manage operational staff (RECEPTIONIST, KITCHEN) - excludes SUB_ADMIN, SUPER_ADMIN, and GUEST
        filter.role = { $in: [ROLES.RECEPTIONIST, ROLES.KITCHEN] };
      } else {
        // By default, staff/members endpoint excludes GUEST accounts unless explicitly queried with ?role=GUEST
        filter.role = { $ne: ROLES.GUEST };
      }
    }

    // Search filter across name, username, email
    if (search?.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { name: searchRegex },
        { username: searchRegex },
        { email: searchRegex },
      ];
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .select("-password");

    return res.status(200).json({
      success: true,
      data: users.map(userResponseDTO),
    });
  } catch (error) {
    logger.error(error, "Get users error");

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

// =====================================================
// UPDATE USER
// =====================================================

export const updateUser = async (req, res) => {
  try {
    const { id } = req.validated.params;
    const { name, email, role, isActive, password } = req.validated.body;

    const target = await User.findById(id);

    if (!target) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (target.role === "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Super Admin accounts cannot be modified here",
      });
    }

    // Sub Admins can only update staff of their own hotel
    if (req.user.role === "SUB_ADMIN") {
      if (
        !req.user.hotelId ||
        String(target.hotelId) !== String(req.user.hotelId)
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only update users belonging to your hotel",
        });
      }

      if (!["RECEPTIONIST", "KITCHEN"].includes(target.role)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to update this user",
        });
      }

      if (role && !["RECEPTIONIST", "KITCHEN"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role for hotel member",
        });
      }
    }

    // Update fields
    if (name?.trim()) {
      target.name = name.trim();
    }

    if (email !== undefined) {
      const cleanEmail = email?.trim() ? email.trim().toLowerCase() : "";
      if (cleanEmail && cleanEmail !== target.email) {
        const existingEmail = await User.findOne({
          email: cleanEmail,
          _id: { $ne: target._id },
          isDeleted: { $ne: true },
        });
        if (existingEmail) {
          return res.status(409).json({
            success: false,
            message: "Email is already registered to another active account",
          });
        }
      }
      target.email = cleanEmail;
    }

    if (role) {
      target.role = role;
    }

    if (isActive !== undefined) {
      target.isActive = isActive;
    }

    if (password?.trim()) {
      target.password = password.trim();
      target.failedLoginAttempts = 0;
      target.lockUntil = null;
      target.mustChangePassword = false;
    }

    await target.save();

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: userResponseDTO(target),
    });
  } catch (error) {
    logger.error(error, "Update user error");

    return res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

// =====================================================
// RESET USER PASSWORD
// =====================================================

export const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.validated.params;
    const { password } = req.validated.body;

    const target = await User.findById(id);

    if (!target) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (target.role === "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Super Admin passwords cannot be reset through this endpoint",
      });
    }

    // Sub Admins can only reset password for staff of their own hotel
    if (req.user.role === "SUB_ADMIN") {
      if (
        !req.user.hotelId ||
        String(target.hotelId) !== String(req.user.hotelId)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only reset passwords for users belonging to your hotel",
        });
      }

      if (!["RECEPTIONIST", "KITCHEN"].includes(target.role)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to reset password for this user",
        });
      }
    }

    target.password = password.trim();
    target.failedLoginAttempts = 0;
    target.lockUntil = null;
    target.mustChangePassword = false;

    await target.save();

    return res.status(200).json({
      success: true,
      message: "User password reset successfully",
    });
  } catch (error) {
    logger.error(error, "Reset user password error");

    return res.status(500).json({
      success: false,
      message: "Failed to reset password",
    });
  }
};

// =====================================================
// DELETE USER (Soft delete for Sub-Admin; Soft or Permanent for Super-Admin)
// =====================================================

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.validated.params;
    const isPermanent =
      req.query.permanent === "true" || req.query.permanent === true;

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

      // Sub Admin always soft-deletes and frees the original username
      target.originalUsername = target.originalUsername || target.username;
      target.username = `${target.username}_deleted_${Date.now()}`;
      target.isDeleted = true;
      target.deletedAt = new Date();
      target.isActive = false;

      await target.save();
      await UserInvite.deleteMany({ userId: target._id });

      return res.status(200).json({
        success: true,
        message: "User account deleted successfully",
      });
    }

    // Super Admin execution
    if (isPermanent) {
      await UserInvite.deleteMany({ userId: target._id });
      await target.deleteOne();

      return res.status(200).json({
        success: true,
        message: "User permanently deleted successfully",
      });
    }

    // Super Admin soft-delete
    target.originalUsername = target.originalUsername || target.username;
    target.username = `${target.username}_deleted_${Date.now()}`;
    target.isDeleted = true;
    target.deletedAt = new Date();
    target.isActive = false;

    await target.save();
    await UserInvite.deleteMany({ userId: target._id });

    return res.status(200).json({
      success: true,
      message: "User soft-deleted successfully",
    });
  } catch (error) {
    logger.error(error, "Delete user error");

    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

// =====================================================
// RESTORE USER (Super-Admin only)
// =====================================================

export const restoreUser = async (req, res) => {
  try {
    const { id } = req.validated.params;
    const requestedUsername = req.validated.body?.newUsername
      ?.trim()
      .toLowerCase();

    const target = await User.findById(id);

    if (!target) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!target.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "User account is not deleted",
      });
    }

    // Resolve which username to restore
    const usernameToRestore =
      requestedUsername ||
      target.originalUsername ||
      target.username.replace(/_deleted_\d+$/, "");

    // Check if this username is already taken by another active user
    const existingActiveUser = await User.findOne({
      username: usernameToRestore,
      _id: { $ne: target._id },
      isDeleted: { $ne: true },
    });

    if (existingActiveUser) {
      return res.status(409).json({
        success: false,
        code: "USERNAME_TAKEN",
        originalUsername: target.originalUsername,
        message: `Username '${usernameToRestore}' is already in use by an active account. Please provide a new username to restore this user.`,
      });
    }

    target.username = usernameToRestore;
    target.isDeleted = false;
    target.deletedAt = null;
    target.isActive = true;

    await target.save();

    return res.status(200).json({
      success: true,
      message: "User restored successfully",
      data: userResponseDTO(target),
    });
  } catch (error) {
    logger.error(error, "Restore user error");

    return res.status(500).json({
      success: false,
      message: "Failed to restore user",
    });
  }
};
