import jwt from "jsonwebtoken";

import User from "#/modules/users/models/User.js";
import Hotel from "#/modules/hotels/models/Hotel.js";
import UserInvite from "../models/UserInvite.js";

import {
  generateInviteToken,
  getInviteExpiry,
} from "#/shared/utils/invitation.js";

import { sendInvitationEmail } from "#/shared/services/email.service.js";

import { ROLES } from "#/shared/constants/roles.js";

// =====================================================
// SEND INVITATION
// =====================================================

export const sendInvite = async (req, res) => {
  try {
    console.log("======================================");
    console.log("SEND INVITE REQUEST");
    console.log("DATABASE:", User.db.name);
    console.log("BODY:", req.body);
    console.log("======================================");

    const { name, username, email, role, hotelId } = req.body;

    // =================================================
    // BASIC VALIDATION
    // =================================================

    if (!name?.trim() || !username?.trim() || !email?.trim() || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, username, email and role are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const normalizedUsername = username.trim().toLowerCase();

    // =================================================
    // VALID INVITABLE ROLES
    // =================================================

    const allowedInviteRoles = [
      ROLES.SUB_ADMIN,
      ROLES.RECEPTIONIST,
      ROLES.KITCHEN,
    ];

    if (!allowedInviteRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role for invitation",
      });
    }

    let assignedHotelId = null;
    let hotel = null;

    // =================================================
    // SUPER ADMIN INVITES SUB ADMIN
    // =================================================

    if (req.user.role === ROLES.SUPER_ADMIN) {
      if (role !== ROLES.SUB_ADMIN) {
        return res.status(403).json({
          success: false,
          message: "Super Admin can only invite Sub Admins",
        });
      }

      if (!hotelId) {
        return res.status(400).json({
          success: false,
          message: "hotelId is required when inviting a Sub Admin",
        });
      }

      hotel = await Hotel.findById(hotelId);

      if (!hotel) {
        return res.status(404).json({
          success: false,
          message: "Hotel not found",
        });
      }

      assignedHotelId = hotel._id;
    }

    // =================================================
    // SUB ADMIN INVITES STAFF
    // =================================================
    else if (req.user.role === ROLES.SUB_ADMIN) {
      if (role !== ROLES.RECEPTIONIST && role !== ROLES.KITCHEN) {
        return res.status(403).json({
          success: false,
          message: "Sub Admin can only invite Receptionist or Kitchen staff",
        });
      }

      if (!req.user.hotelId) {
        return res.status(400).json({
          success: false,
          message: "Sub Admin is not assigned to a hotel",
        });
      }

      hotel = await Hotel.findById(req.user.hotelId);

      if (!hotel) {
        return res.status(404).json({
          success: false,
          message: "Hotel not found",
        });
      }

      assignedHotelId = hotel._id;
    }

    // =================================================
    // NO PERMISSION
    // =================================================
    else {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to send invitations",
      });
    }

    // =================================================
    // HOTEL STATUS
    // =================================================

    if (hotel.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Cannot send invitation for an inactive hotel",
      });
    }

    // =================================================
    // CHECK EXISTING USER
    // =================================================

    const existingUser = await User.findOne({
      $or: [
        {
          email: normalizedEmail,
        },
        {
          username: normalizedUsername,
        },
      ],
    });

    console.log(
      "EXISTING USER:",
      existingUser
        ? {
            id: existingUser._id,
            email: existingUser.email,
            username: existingUser.username,
            isActive: existingUser.isActive,
          }
        : null,
    );

    // =================================================
    // REMOVE OLD INACTIVE INVITED USER
    // =================================================

    if (existingUser) {
      if (
        existingUser.isActive === false &&
        existingUser.mustChangePassword === true
      ) {
        console.log("Removing old pending user:", existingUser._id);

        await UserInvite.deleteMany({
          userId: existingUser._id,
        });

        await User.deleteOne({
          _id: existingUser._id,
        });
      } else {
        return res.status(409).json({
          success: false,
          message: "A user with this email or username already exists",
        });
      }
    }

    // =================================================
    // REMOVE OLD PENDING INVITES
    // =================================================

    await UserInvite.deleteMany({
      status: "PENDING",
      $or: [
        {
          email: normalizedEmail,
        },
        {
          username: normalizedUsername,
        },
      ],
    });

    // =================================================
    // CREATE INVITED USER
    // =================================================

    const temporaryPassword = generateInviteToken();

    const user = await User.create({
      name: name.trim(),

      username: normalizedUsername,

      email: normalizedEmail,

      password: temporaryPassword,

      role,

      hotelId: assignedHotelId,

      isActive: false,

      mustChangePassword: true,
    });

    console.log("NEW USER CREATED:", user._id);

    // =================================================
    // CREATE INVITATION
    // =================================================

    const token = generateInviteToken();

    const expiresAt = getInviteExpiry();

    const invite = await UserInvite.create({
      userId: user._id,

      hotelId: assignedHotelId,

      role,

      token,

      expiresAt,

      status: "PENDING",
    });

    console.log("NEW INVITE CREATED:", invite._id);

    // =================================================
    // FRONTEND URL
    // =================================================

    const frontendUrl =
      process.env.SUB_ADMIN_FRONTEND_URL || "http://localhost:5175";

    const inviteUrl = `${frontendUrl}/accept-invitation?token=${token}`;

    console.log("INVITATION URL:", inviteUrl);

    // =================================================
    // SEND EMAIL
    // =================================================

    await sendInvitationEmail({
      email: user.email,

      name: user.name,

      inviteUrl,

      role: user.role,

      hotelName: hotel.name,
    });

    console.log("INVITATION EMAIL SENT TO:", user.email);

    // =================================================
    // SUCCESS
    // =================================================

    return res.status(201).json({
      success: true,

      message: "Invitation sent successfully",

      data: {
        inviteId: invite._id,

        userId: user._id,

        name: user.name,

        username: user.username,

        email: user.email,

        role: user.role,

        hotelId: user.hotelId,

        expiresAt: invite.expiresAt,
      },
    });
  } catch (error) {
    console.error("SEND INVITE ERROR:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A user or invitation with these details already exists",
        error: error.keyValue,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to send invitation",
      error: error.message,
    });
  }
};

// =====================================================
// VERIFY INVITATION
// =====================================================

export const verifyInvite = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Invitation token is required",
      });
    }

    // =================================================
    // FIND INVITATION
    // =================================================

    const invite = await UserInvite.findOne({
      token,
      status: "PENDING",
    });

    if (!invite) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found or already used",
      });
    }

    // =================================================
    // CHECK EXPIRY
    // =================================================

    if (new Date(invite.expiresAt) < new Date()) {
      invite.status = "EXPIRED";

      await invite.save();

      return res.status(400).json({
        success: false,
        message: "This invitation has expired",
      });
    }

    // =================================================
    // FIND USER
    // =================================================

    const user = await User.findById(invite.userId).select("+email +username");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invited user not found",
      });
    }

    // =================================================
    // FIND HOTEL
    // =================================================

    const hotel = await Hotel.findById(invite.hotelId);

    // =================================================
    // SUCCESS
    // =================================================

    return res.status(200).json({
      success: true,

      message: "Invitation is valid",

      data: {
        name: user.name,

        email: user.email,

        username: user.username,

        role: user.role,

        hotelName: hotel?.name || "",
      },
    });
  } catch (error) {
    console.error("VERIFY INVITATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify invitation",
      error: error.message,
    });
  }
};

// =====================================================
// ACCEPT INVITATION + CREATE ACCOUNT
// =====================================================

export const acceptInvite = async (req, res) => {
  try {
    const { token, name, username, password } = req.body;

    // =================================================
    // VALIDATION
    // =================================================

    if (!token || !name?.trim() || !username?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Token, name, username and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const normalizedUsername = username.trim().toLowerCase();

    // =================================================
    // FIND INVITATION
    // =================================================

    const invite = await UserInvite.findOne({
      token,
      status: "PENDING",
    });

    if (!invite) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found, expired, or already used",
      });
    }

    // =================================================
    // CHECK EXPIRY
    // =================================================

    if (new Date(invite.expiresAt) < new Date()) {
      invite.status = "EXPIRED";

      await invite.save();

      return res.status(400).json({
        success: false,
        message: "This invitation has expired",
      });
    }

    // =================================================
    // FIND INVITED USER
    // =================================================

    const user = await User.findById(invite.userId).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invited user not found",
      });
    }

    // =================================================
    // CHECK USERNAME
    // =================================================

    const usernameExists = await User.findOne({
      username: normalizedUsername,

      _id: {
        $ne: user._id,
      },
    });

    if (usernameExists) {
      return res.status(409).json({
        success: false,
        message: "This username is already taken",
      });
    }

    // =================================================
    // UPDATE USER
    // =================================================

    user.name = name.trim();

    user.username = normalizedUsername;

    user.password = password;

    user.isActive = true;

    user.mustChangePassword = false;

    await user.save();

    console.log("INVITED USER ACTIVATED:", user._id);

    // =================================================
    // MARK INVITE AS ACCEPTED
    // =================================================

    invite.status = "ACCEPTED";

    await invite.save();

    console.log("INVITATION ACCEPTED:", invite._id);

    // =================================================
    // JWT SECRET CHECK
    // =================================================

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing from environment variables");

      return res.status(500).json({
        success: false,
        message: "Server authentication configuration error",
      });
    }

    // =================================================
    // GENERATE JWT
    // =================================================

    const authToken = jwt.sign(
      {
        userId: user._id,

        role: user.role,

        hotelId: user.hotelId,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "7d",
      },
    );

    // =================================================
    // SUCCESS
    // =================================================

    return res.status(200).json({
      success: true,

      message: "Account created successfully",

      data: {
        token: authToken,

        user: {
          id: user._id,

          name: user.name,

          username: user.username,

          email: user.email,

          role: user.role,

          hotelId: user.hotelId,
        },
      },
    });
  } catch (error) {
    console.error("ACCEPT INVITATION ERROR:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Username already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create account",
      error: error.message,
    });
  }
};
