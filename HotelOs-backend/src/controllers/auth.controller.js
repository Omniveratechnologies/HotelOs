import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import { generateInviteToken } from "../utils/invitation.js";
import {
  sendUsernameReminderEmail,
  sendPasswordResetEmail
} from "../services/email.service.js";

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required"
      });
    }

    const user = await User
      .findOne({ username })
      .select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is disabled"
      });
    }

    const isPasswordCorrect =
      await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          role: user.role,
          hotelId: user.hotelId,
          roomId: user.roomId,
          mustChangePassword: user.mustChangePassword
        }
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
};

export const createSubAdmin = async (req, res) => {
  try {
    const { name, username, email, password, hotelId } = req.body;

    if (!name || !username || !email || !password || !hotelId) {
      return res.status(400).json({
        success: false,
        message: "name, username, email, password and hotelId are required"
      });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists"
      });
    }

    const subAdmin = await User.create({
      name,
      username,
      email,
      password,
      role: "SUB_ADMIN",
      hotelId
    });

    return res.status(201).json({
      success: true,
      message: "Sub Admin created successfully",
      data: {
        id: subAdmin._id,
        name: subAdmin.name,
        username: subAdmin.username,
        email: subAdmin.email,
        role: subAdmin.role,
        hotelId: subAdmin.hotelId
      }
    });

  } catch (error) {
    console.error("Create Sub Admin Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create Sub Admin"
    });
  }
};

// ---------Logout Contoller-----------

export const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logout successful"
  });
};

// =====================================================
// FORGOT USERNAME
// =====================================================

export const forgotUsername = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    // Same response either way so accounts cannot be enumerated
    const message =
      "If an account exists with this email, your username has been sent.";

    if (!user || !user.email) {
      return res.status(200).json({
        success: true,
        message
      });
    }

    await sendUsernameReminderEmail({
      email: user.email,
      name: user.name,
      username: user.username
    });

    console.log("USERNAME REMINDER SENT TO:", user.email);

    return res.status(200).json({
      success: true,
      message
    });
  } catch (error) {
    console.error("Forgot Username Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process forgot username request"
    });
  }
};

// =====================================================
// FORGOT PASSWORD
// =====================================================

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    // Same response either way so accounts cannot be enumerated
    const message =
      "If an account exists with this email, a password reset link has been sent.";

    if (!user || !user.email) {
      return res.status(200).json({
        success: true,
        message
      });
    }

    const resetToken = generateInviteToken();

    // Reset link valid for 1 hour
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);

    await user.save();

    const subAdminFrontendUrl =
      process.env.SUB_ADMIN_FRONTEND_URL ||
      "http://localhost:5175";

    const resetUrl =
      `${subAdminFrontendUrl}/reset-password?token=${resetToken}`;

    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetUrl
    });

    console.log("PASSWORD RESET EMAIL SENT TO:", user.email);

    return res.status(200).json({
      success: true,
      message
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process forgot password request"
    });
  }
};

// =====================================================
// RESET PASSWORD
// =====================================================

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Token and password are required"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long"
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "This password reset link is invalid or has expired"
      });
    }

    // Pre-save hook hashes the new password
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.mustChangePassword = false;

    await user.save();

    console.log("PASSWORD RESET FOR USER:", user._id);

    return res.status(200).json({
      success: true,
      message: "Your password has been reset successfully"
    });
  } catch (error) {
    console.error("Reset Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reset password"
    });
  }
};

