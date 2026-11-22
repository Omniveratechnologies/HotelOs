import User from "#/modules/users/models/User.js";
import Booking from "#/modules/bookings/models/Booking.js";
import Hotel from "#/modules/hotels/models/Hotel.js";
import {
  generateToken,
  generateAccountSelectionToken,
  verifyAccountSelectionToken,
} from "#/shared/utils/jwt.js";
import { generateInviteToken } from "#/shared/utils/invitation.js";
import {
  sendUsernameReminderEmail,
  sendPasswordResetEmail,
  sendAccountSelectionEmail,
} from "#/shared/services/email.service.js";
import {
  logAuditEvent,
  AUDIT_EVENTS,
} from "#/shared/services/audit.service.js";
import { env } from "#/config/env.js";
import logger from "#/utils/logger.js";
import { compare } from "bcryptjs";

/**
 * Find user by username with timing attack protection
 * Always performs the same operations regardless of user existence
 */
async function findUserForLogin(username) {
  const user = await User.findOne({
    username,
    isDeleted: { $ne: true },
  }).select("+password +failedLoginAttempts +lockUntil +passwordHistory");

  // If user not found, still do a dummy bcrypt comparison to normalize timing
  if (!user) {
    await compare("dummy-password", "$2a$12$dummyhashdummyhashdummyhashdummy");
    return null;
  }

  return user;
}

/**
 * Check if account is locked
 */
function isAccountLocked(user) {
  return user.lockUntil && user.lockUntil > new Date();
}

/**
 * Calculate remaining lockout time in minutes
 */
function getLockoutMinutes(user) {
  if (!user.lockUntil) return 0;
  const remaining = user.lockUntil - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 60000) : 0;
}

// =====================================================
// LOGIN
// =====================================================

export const login = async (req, res) => {
  try {
    const { username, password, expectedRole } = req.validated.body;

    // Find user with timing attack protection
    const user = await findUserForLogin(username);

    if (!user) {
      // Generic message to prevent user enumeration
      await logAuditEvent({
        event: AUDIT_EVENTS.LOGIN_FAILED,
        actor: {
          username,
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
        success: false,
        errorMessage: "User not found",
        correlationId: req.id,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is disabled",
      });
    }

    // Check if account is locked
    if (isAccountLocked(user)) {
      const minutes = getLockoutMinutes(user);
      logger.warn(
        { userId: user._id, username },
        "Login attempt on locked account",
      );

      await logAuditEvent({
        event: AUDIT_EVENTS.LOGIN_LOCKED,
        actor: {
          userId: user._id,
          username: user.username,
          role: user.role,
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
        target: {
          userId: user._id,
          hotelId: user.hotelId,
        },
        details: { lockoutMinutes: minutes },
        success: false,
        errorMessage: "Account locked",
        correlationId: req.id,
      });

      return res.status(423).json({
        success: false,
        message: `Account temporarily locked. Try again in ${minutes} minute(s).`,
        code: "ACCOUNT_LOCKED",
        lockoutMinutes: minutes,
      });
    }

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      // Increment failed login attempts
      await user.incrementFailedLogin();

      logger.warn(
        { userId: user._id, username, attempts: user.failedLoginAttempts },
        "Failed login attempt",
      );

      await logAuditEvent({
        event: AUDIT_EVENTS.LOGIN_FAILED,
        actor: {
          userId: user._id,
          username: user.username,
          role: user.role,
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
        target: {
          userId: user._id,
          hotelId: user.hotelId,
        },
        details: { failedAttempts: user.failedLoginAttempts },
        success: false,
        errorMessage: "Invalid password",
        correlationId: req.id,
      });

      // Check if just locked
      if (isAccountLocked(user)) {
        const minutes = getLockoutMinutes(user);
        await logAuditEvent({
          event: AUDIT_EVENTS.LOGIN_LOCKED,
          actor: {
            userId: user._id,
            username: user.username,
            role: user.role,
            ip: req.ip,
            userAgent: req.get("user-agent"),
          },
          target: {
            userId: user._id,
            hotelId: user.hotelId,
          },
          details: { lockoutMinutes: minutes, reason: "max_failed_attempts" },
          success: false,
          errorMessage: "Account locked after max failed attempts",
          correlationId: req.id,
        });
        return res.status(423).json({
          success: false,
          message: `Too many failed attempts. Account locked for ${minutes} minute(s).`,
          code: "ACCOUNT_LOCKED",
          lockoutMinutes: minutes,
        });
      }

      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check role if expectedRole provided
    if (expectedRole && user.role !== expectedRole) {
      return res.status(403).json({
        success: false,
        message: `This account does not have ${expectedRole.toLowerCase()} access.`,
      });
    }

    // Reset failed login attempts on successful login
    await user.resetFailedLogin();

    const token = generateToken(user);

    // Guests are tied to a stay via Booking; resolve their current room and stay state
    let roomId = null;
    let bookingStatus = "none";
    let reservationNo = null;
    let hotelName = null;

    if (user.role === "GUEST") {
      const currentBooking = await Booking.findOne({
        guestId: user._id,
      }).sort({ createdAt: -1 });

      roomId = currentBooking?.roomId ?? null;
      bookingStatus = currentBooking?.status ?? "none";
      reservationNo = currentBooking?.reservationNo ?? null;

      if (user.hotelId) {
        const hotel = await Hotel.findById(user.hotelId).select("name");
        hotelName = hotel?.name ?? null;
      }
    }

    // Check if 2FA is enabled for this user
    const userWith2FA = await User.findById(user._id).select(
      "+twoFactorEnabled +twoFactorSecret",
    );

    // If 2FA is enabled, return challenge instead of token
    if (userWith2FA?.twoFactorEnabled) {
      await logAuditEvent({
        event: AUDIT_EVENTS.LOGIN_SUCCESS,
        actor: {
          userId: user._id,
          username: user.username,
          role: user.role,
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
        target: {
          userId: user._id,
          hotelId: user.hotelId,
        },
        details: { expectedRole, method: "password_only", requires2FA: true },
        success: true,
        correlationId: req.id,
      });

      logger.info(
        { userId: user._id, username, role: user.role },
        "Login successful - 2FA required",
      );

      return res.status(200).json({
        success: true,
        message: "Password verified. 2FA required.",
        requires2FA: true,
        data: {
          userId: user._id,
          username: user.username,
          role: user.role,
          hotelId: user.hotelId,
          hotelName,
          roomId,
          bookingStatus,
          reservationNo,
          mustChangePassword: user.mustChangePassword,
        },
      });
    }

    // 2FA not enabled or not required - proceed with normal login
    logger.info(
      { userId: user._id, username, role: user.role },
      "Login successful",
    );

    await logAuditEvent({
      event: AUDIT_EVENTS.LOGIN_SUCCESS,
      actor: {
        userId: user._id,
        username: user.username,
        role: user.role,
        ip: req.ip,
        userAgent: req.get("user-agent"),
      },
      target: {
        userId: user._id,
        hotelId: user.hotelId,
      },
      details: { expectedRole },
      success: true,
      correlationId: req.id,
    });

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
          hotelName,
          roomId,
          bookingStatus,
          reservationNo,
          mustChangePassword: user.mustChangePassword,
        },
      },
    });
  } catch (error) {
    logger.error(error, "Login failed");
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// =====================================================
// CREATE SUB ADMIN
// =====================================================

export const createSubAdmin = async (req, res) => {
  try {
    const { name, username, email, password, hotelId } = req.validated.body;

    // Check if password was recently used (prevent reuse)
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    }).select("+passwordHistory");

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    // Check password history for the new password (if user exists with same email/username elsewhere)
    // This is handled by the pre-save hook in User model

    const subAdmin = await User.create({
      name,
      username,
      email,
      password,
      role: "SUB_ADMIN",
      hotelId,
    });

    logger.info(
      { userId: subAdmin._id, username: subAdmin.username },
      "Sub Admin created",
    );

    return res.status(201).json({
      success: true,
      message: "Sub Admin created successfully",
      data: {
        id: subAdmin._id,
        name: subAdmin.name,
        username: subAdmin.username,
        email: subAdmin.email,
        role: subAdmin.role,
        hotelId: subAdmin.hotelId,
      },
    });
  } catch (error) {
    logger.error(error, "Create Sub Admin Error");

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create Sub Admin",
    });
  }
};

// =====================================================
// LOGOUT
// =====================================================

export const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};

// =====================================================
// PORTAL RECOVERY HELPERS
// =====================================================

const PORTAL_ROLE_MAP = {
  SUPER_ADMIN: ["SUPER_ADMIN"],
  SUB_ADMIN: ["SUB_ADMIN"],
  RECEPTIONIST: ["RECEPTIONIST"],
  KITCHEN: ["KITCHEN"],
  GUEST: ["GUEST"],
};

const PORTAL_NAME_MAP = {
  SUPER_ADMIN: "Super Admin Portal",
  SUB_ADMIN: "Sub-Admin Portal",
  RECEPTIONIST: "Receptionist Portal",
  KITCHEN: "Kitchen Portal",
  GUEST: "Guest Portal",
};

const getPortalBaseUrl = (portal) => {
  switch (portal) {
    case "SUPER_ADMIN":
      return env.frontendUrls.superAdmin;
    case "SUB_ADMIN":
      return env.frontendUrls.subAdmin;
    case "RECEPTIONIST":
      return env.frontendUrls.receptionist;
    case "KITCHEN":
      return env.frontendUrls.kitchen;
    case "GUEST":
      return env.frontendUrls.guest;
    default:
      return env.frontendUrls.subAdmin;
  }
};

// =====================================================
// FORGOT USERNAME
// =====================================================

export const forgotUsername = async (req, res) => {
  try {
    const { email, portal } = req.validated.body;

    const normalizedEmail = email.trim().toLowerCase();

    const roles = portal ? PORTAL_ROLE_MAP[portal] : undefined;
    const query = {
      email: normalizedEmail,
      isActive: true,
      ...(roles ? { role: { $in: roles } } : {}),
    };

    const users = await User.find(query).select(
      "name username hotelId role email",
    );

    // Same response either way so accounts cannot be enumerated
    const message =
      "If an account exists with this email, your username has been sent.";

    if (!users || users.length === 0) {
      return res.status(200).json({
        success: true,
        message,
      });
    }

    const portalName = portal
      ? PORTAL_NAME_MAP[portal] || "HotelOS Portal"
      : "HotelOS";
    const usernames = users.map((u) => u.username);

    await sendUsernameReminderEmail({
      email: normalizedEmail,
      name: users[0].name,
      usernames,
      portalName,
    });

    logger.info(
      { email: normalizedEmail, portal, count: users.length },
      "Username reminder sent",
    );

    return res.status(200).json({
      success: true,
      message,
    });
  } catch (error) {
    logger.error(error, "Forgot Username Error");

    return res.status(500).json({
      success: false,
      message: "Failed to process forgot username request",
    });
  }
};

// =====================================================
// FORGOT PASSWORD
// =====================================================

export const forgotPassword = async (req, res) => {
  try {
    const { identifier, email, portal } = req.validated.body;

    const rawInput = (identifier || email || "").trim();
    const isEmail = rawInput.includes("@");

    // Same response either way so accounts cannot be enumerated
    const message =
      "If an account exists with this email, a password reset link has been sent.";

    const roles = portal ? PORTAL_ROLE_MAP[portal] : undefined;
    const portalName = portal
      ? PORTAL_NAME_MAP[portal] || "HotelOS Portal"
      : "HotelOS Portal";
    const portalBaseUrl = getPortalBaseUrl(portal);

    if (!isEmail) {
      // Input is username
      const username = rawInput.toLowerCase();
      const user = await User.findOne({
        username,
        isActive: true,
        ...(roles ? { role: { $in: roles } } : {}),
      });

      if (!user || !user.email) {
        return res.status(200).json({
          success: true,
          message,
        });
      }

      const resetToken = generateInviteToken();
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();

      const userPortalUrl = portal
        ? portalBaseUrl
        : getPortalBaseUrl(user.role);
      const resetUrl = `${userPortalUrl}/reset-password?token=${resetToken}`;

      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        username: user.username,
        resetUrl,
        portalName,
      });

      logger.info(
        { email: user.email, username: user.username },
        "Password reset email sent via username",
      );

      await logAuditEvent({
        event: AUDIT_EVENTS.PASSWORD_RESET_REQUEST,
        actor: {
          userId: user._id,
          username: user.username,
          role: user.role,
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
        target: {
          userId: user._id,
          hotelId: user.hotelId,
        },
        success: true,
        correlationId: req.id,
      });

      return res.status(200).json({
        success: true,
        message,
      });
    }

    // Input is email
    const normalizedEmail = rawInput.toLowerCase();
    const query = {
      email: normalizedEmail,
      isActive: true,
      ...(roles ? { role: { $in: roles } } : {}),
    };

    const users = await User.find(query).select(
      "name username hotelId role email",
    );

    if (!users || users.length === 0) {
      return res.status(200).json({
        success: true,
        message,
      });
    }

    if (users.length === 1) {
      // Exactly 1 account in this portal
      const singleUser = users[0];
      const resetToken = generateInviteToken();
      singleUser.resetPasswordToken = resetToken;
      singleUser.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
      await singleUser.save();

      const userPortalUrl = portal
        ? portalBaseUrl
        : getPortalBaseUrl(singleUser.role);
      const resetUrl = `${userPortalUrl}/reset-password?token=${resetToken}`;

      await sendPasswordResetEmail({
        email: singleUser.email || normalizedEmail,
        name: singleUser.name,
        username: singleUser.username,
        resetUrl,
        portalName,
      });

      logger.info(
        {
          email: singleUser.email || normalizedEmail,
          username: singleUser.username,
        },
        "Password reset email sent for single user",
      );

      await logAuditEvent({
        event: AUDIT_EVENTS.PASSWORD_RESET_REQUEST,
        actor: {
          userId: singleUser._id,
          username: singleUser.username,
          role: singleUser.role,
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
        target: {
          userId: singleUser._id,
          hotelId: singleUser.hotelId,
        },
        success: true,
        correlationId: req.id,
      });

      return res.status(200).json({
        success: true,
        message,
      });
    }

    // Multiple accounts found in this portal!
    // Never send reset tokens for all accounts at once.
    // Instead send account selection email with short-lived signed token (15 mins).
    const selectionToken = generateAccountSelectionToken({
      email: normalizedEmail,
      portal: portal || "SUB_ADMIN",
    });

    const selectUrl = `${portalBaseUrl}/reset-password?selectionToken=${selectionToken}`;

    await sendAccountSelectionEmail({
      email: normalizedEmail,
      name: users[0].name,
      selectUrl,
      portalName,
    });

    logger.info(
      { email: normalizedEmail, portal, count: users.length },
      "Account selection email sent",
    );

    return res.status(200).json({
      success: true,
      message,
    });
  } catch (error) {
    logger.error(error, "Forgot Password Error");

    return res.status(500).json({
      success: false,
      message: "Failed to process forgot password request",
    });
  }
};

// =====================================================
// GET RESET PASSWORD ACCOUNTS (MULTI-ACCOUNT SELECTION)
// =====================================================

export const getResetPasswordAccounts = async (req, res) => {
  try {
    const { token } = req.validated.query;
    const decoded = verifyAccountSelectionToken(token);

    if (!decoded || !decoded.email) {
      return res.status(400).json({
        success: false,
        message: "This account selection link is invalid or has expired",
      });
    }

    const roles = decoded.portal ? PORTAL_ROLE_MAP[decoded.portal] : undefined;

    const users = await User.find({
      email: decoded.email,
      isActive: true,
      ...(roles ? { role: { $in: roles } } : {}),
    })
      .select("username name hotelId role")
      .populate("hotelId", "name");

    const accounts = users.map((u) => ({
      username: u.username,
      name: u.name,
      hotelName: u.hotelId?.name || "All Properties",
    }));

    return res.status(200).json({
      success: true,
      data: {
        accounts,
        portal: decoded.portal,
      },
    });
  } catch (error) {
    logger.error(error, "Get Reset Password Accounts Error");
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve accounts",
    });
  }
};

// =====================================================
// SELECT RESET PASSWORD ACCOUNT
// =====================================================

export const selectResetPasswordAccount = async (req, res) => {
  try {
    const { token, username } = req.validated.body;
    const decoded = verifyAccountSelectionToken(token);

    if (!decoded || !decoded.email) {
      return res.status(400).json({
        success: false,
        message: "This account selection link is invalid or has expired",
      });
    }

    const roles = decoded.portal ? PORTAL_ROLE_MAP[decoded.portal] : undefined;

    const user = await User.findOne({
      username: username.toLowerCase().trim(),
      email: decoded.email,
      isActive: true,
      ...(roles ? { role: { $in: roles } } : {}),
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "The selected account was not found or is inactive",
      });
    }

    const resetToken = generateInviteToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    await logAuditEvent({
      event: AUDIT_EVENTS.PASSWORD_RESET_REQUEST,
      actor: {
        userId: user._id,
        username: user.username,
        role: user.role,
        ip: req.ip,
        userAgent: req.get("user-agent"),
      },
      target: {
        userId: user._id,
        hotelId: user.hotelId,
      },
      success: true,
      correlationId: req.id,
    });

    return res.status(200).json({
      success: true,
      data: {
        resetToken,
      },
      message: "Account selected. You may now reset your password.",
    });
  } catch (error) {
    logger.error(error, "Select Reset Password Account Error");
    return res.status(500).json({
      success: false,
      message: "Failed to select account",
    });
  }
};

// =====================================================
// RESET PASSWORD
// =====================================================

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.validated.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    }).select(
      "+password +resetPasswordToken +resetPasswordExpires +passwordHistory",
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "This password reset link is invalid or has expired",
      });
    }

    // Check password reuse (prevent using last 5 passwords)
    const isReused = await user.isPasswordReused(password);
    if (isReused) {
      return res.status(400).json({
        success: false,
        message:
          "Password was recently used and cannot be reused. Please choose a different password.",
      });
    }

    user.password = password;
    user.mustChangePassword = false;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    logger.info({ userId: user._id }, "Password reset");

    await logAuditEvent({
      event: AUDIT_EVENTS.PASSWORD_RESET_SUCCESS,
      actor: {
        userId: user._id,
        username: user.username,
        role: user.role,
        ip: req.ip,
        userAgent: req.get("user-agent"),
      },
      target: {
        userId: user._id,
        hotelId: user.hotelId,
      },
      success: true,
      correlationId: req.id,
    });

    return res.status(200).json({
      success: true,
      message: "Your password has been reset successfully",
    });
  } catch (error) {
    logger.error(error, "Reset Password Error");

    return res.status(500).json({
      success: false,
      message: "Failed to reset password",
    });
  }
};

// =====================================================
// CHANGE PASSWORD (authenticated user)
// =====================================================

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.validated.body;
    const userId = req.user._id;

    const user = await User.findById(userId).select(
      "+password +passwordHistory",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isCurrentCorrect = await user.comparePassword(currentPassword);
    if (!isCurrentCorrect) {
      await logAuditEvent({
        event: AUDIT_EVENTS.PASSWORD_CHANGE,
        actor: {
          userId,
          username: user.username,
          role: user.role,
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
        target: {
          userId,
          hotelId: user.hotelId,
        },
        success: false,
        errorMessage: "Current password incorrect",
        correlationId: req.id,
      });

      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Check password reuse
    const isReused = await user.isPasswordReused(newPassword);
    if (isReused) {
      return res.status(400).json({
        success: false,
        message:
          "Password was recently used and cannot be reused. Please choose a different password.",
      });
    }

    // Update password
    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    logger.info({ userId }, "Password changed");

    await logAuditEvent({
      event: AUDIT_EVENTS.PASSWORD_CHANGE,
      actor: {
        userId,
        username: user.username,
        role: user.role,
        ip: req.ip,
        userAgent: req.get("user-agent"),
      },
      target: {
        userId,
        hotelId: user.hotelId,
      },
      success: true,
      correlationId: req.id,
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    logger.error(error, "Change Password Error");

    return res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};
