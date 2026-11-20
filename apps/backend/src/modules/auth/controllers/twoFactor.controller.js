import User from "#/modules/users/models/User.js";
import {
  logAuditEvent,
  AUDIT_EVENTS,
} from "#/shared/services/audit.service.js";
import {
  generateTwoFactorSecret,
  verifyToken,
  getUnusedBackupCodesCount,
  getSetupInstructions,
} from "#/shared/services/twoFactor.service.js";
import logger from "#/utils/logger.js";

/**
 * Get 2FA setup instructions and recommended apps
 */
export const getTwoFactorSetupInfo = async (req, res) => {
  try {
    const instructions = getSetupInstructions();

    return res.status(200).json({
      success: true,
      message: "2FA setup information retrieved",
      data: instructions,
    });
  } catch (error) {
    logger.error(error, "Get 2FA setup info error");
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve 2FA setup information",
    });
  }
};

/**
 * Initiate 2FA setup - generate secret, QR code, and backup codes
 */
export const setupTwoFactor = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select(
      "+twoFactorSecret +twoFactorEnabled +twoFactorBackupCodes",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: "2FA is already enabled. Disable it first to set up again.",
      });
    }

    // Generate new secret and QR code
    const { secret, qrCodeUrl, backupCodes, manualEntryKey, backupCodesFull } =
      await generateTwoFactorSecret(userId, user.username);

    // Store secret and backup codes (not enabled until verified)
    user.twoFactorSecret = secret;
    user.twoFactorBackupCodes = backupCodesFull;
    user.twoFactorEnabled = false;
    await user.save();

    await logAuditEvent({
      event: AUDIT_EVENTS.USER_UPDATED,
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
      details: { action: "2fa_setup_initiated" },
      success: true,
      correlationId: req.id,
    });

    logger.info({ userId }, "2FA setup initiated");

    return res.status(200).json({
      success: true,
      message: "2FA setup initiated. Scan QR code and verify with a token.",
      data: {
        secret,
        qrCodeUrl,
        backupCodes,
        manualEntryKey,
      },
    });
  } catch (error) {
    logger.error(error, "Setup 2FA error");
    return res.status(500).json({
      success: false,
      message: "Failed to initiate 2FA setup",
    });
  }
};

/**
 * Verify 2FA token during setup to enable 2FA
 */
export const verifyTwoFactorSetup = async (req, res) => {
  try {
    const { token } = req.validated.body;
    const userId = req.user._id;

    const user = await User.findById(userId).select(
      "+twoFactorSecret +twoFactorEnabled +twoFactorBackupCodes",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: "2FA is already enabled",
      });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: "No 2FA setup in progress. Initiate setup first.",
      });
    }

    // Verify the token
    const isValid = verifyToken(token, user.twoFactorSecret);

    if (!isValid) {
      await logAuditEvent({
        event: AUDIT_EVENTS.USER_UPDATED,
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
        details: { action: "2fa_setup_verify_failed" },
        success: false,
        errorMessage: "Invalid 2FA token",
        correlationId: req.id,
      });

      return res.status(400).json({
        success: false,
        message: "Invalid 2FA token. Please try again.",
      });
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    await user.save();

    await logAuditEvent({
      event: AUDIT_EVENTS.USER_UPDATED,
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
      details: { action: "2fa_enabled" },
      success: true,
      correlationId: req.id,
    });

    logger.info({ userId }, "2FA enabled");

    return res.status(200).json({
      success: true,
      message: "2FA has been enabled successfully",
      data: {
        enabled: true,
        backupCodesRemaining: getUnusedBackupCodesCount(
          user.twoFactorBackupCodes,
        ),
      },
    });
  } catch (error) {
    logger.error(error, "Verify 2FA setup error");
    return res.status(500).json({
      success: false,
      message: "Failed to verify 2FA setup",
    });
  }
};

/**
 * Get 2FA status for current user
 */
export const getTwoFactorStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select(
      "+twoFactorEnabled +twoFactorBackupCodes",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const backupCodesRemaining = getUnusedBackupCodesCount(
      user.twoFactorBackupCodes,
    );

    return res.status(200).json({
      success: true,
      message: "2FA status retrieved",
      data: {
        enabled: user.twoFactorEnabled,
        required: user.isTwoFactorRequired(),
        backupCodesRemaining,
      },
    });
  } catch (error) {
    logger.error(error, "Get 2FA status error");
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve 2FA status",
    });
  }
};

/**
 * Disable 2FA - requires password + token or backup code
 */
export const disableTwoFactor = async (req, res) => {
  try {
    const { password, token, backupCode } = req.validated.body;
    const userId = req.user._id;

    const user = await User.findById(userId).select(
      "+password +twoFactorSecret +twoFactorEnabled +twoFactorBackupCodes",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: "2FA is not enabled",
      });
    }

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      await logAuditEvent({
        event: AUDIT_EVENTS.USER_UPDATED,
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
        details: { action: "2fa_disable_failed", reason: "invalid_password" },
        success: false,
        errorMessage: "Invalid password",
        correlationId: req.id,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // Verify 2FA token or backup code
    let isValid = false;

    if (token) {
      isValid = verifyToken(token, user.twoFactorSecret);
    } else if (backupCode) {
      isValid = await user.verifyBackupCode(backupCode);
    }

    if (!isValid) {
      await logAuditEvent({
        event: AUDIT_EVENTS.USER_UPDATED,
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
        details: { action: "2fa_disable_failed", reason: "invalid_token" },
        success: false,
        errorMessage: "Invalid 2FA token or backup code",
        correlationId: req.id,
      });

      return res.status(400).json({
        success: false,
        message: "Invalid 2FA token or backup code",
      });
    }

    // Disable 2FA
    await user.disableTwoFactor();

    await logAuditEvent({
      event: AUDIT_EVENTS.USER_UPDATED,
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
      details: { action: "2fa_disabled" },
      success: true,
      correlationId: req.id,
    });

    logger.info({ userId }, "2FA disabled");

    return res.status(200).json({
      success: true,
      message: "2FA has been disabled",
      data: {
        enabled: false,
      },
    });
  } catch (error) {
    logger.error(error, "Disable 2FA error");
    return res.status(500).json({
      success: false,
      message: "Failed to disable 2FA",
    });
  }
};

/**
 * Regenerate backup codes
 */
export const regenerateBackupCodes = async (req, res) => {
  try {
    const { password, token, backupCode } = req.validated.body;
    const userId = req.user._id;

    const user = await User.findById(userId).select(
      "+password +twoFactorSecret +twoFactorEnabled +twoFactorBackupCodes",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: "2FA is not enabled",
      });
    }

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // Verify 2FA token or backup code
    let isValid = false;

    if (token) {
      isValid = verifyToken(token, user.twoFactorSecret);
    } else if (backupCode) {
      isValid = await user.verifyBackupCode(backupCode);
    }

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid 2FA token or backup code",
      });
    }

    // Regenerate backup codes
    const newBackupCodes = await user.regenerateBackupCodes();

    await logAuditEvent({
      event: AUDIT_EVENTS.USER_UPDATED,
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
      details: { action: "2fa_backup_codes_regenerated" },
      success: true,
      correlationId: req.id,
    });

    logger.info({ userId }, "2FA backup codes regenerated");

    return res.status(200).json({
      success: true,
      message: "Backup codes regenerated successfully",
      data: {
        backupCodes: newBackupCodes,
      },
    });
  } catch (error) {
    logger.error(error, "Regenerate backup codes error");
    return res.status(500).json({
      success: false,
      message: "Failed to regenerate backup codes",
    });
  }
};

/**
 * Verify 2FA during login (for frontend to check if 2FA challenge needed)
 */
export const verifyTwoFactorLogin = async (req, res) => {
  try {
    const { userId, token, backupCode } = req.validated.body;

    const user = await User.findById(userId).select(
      "+twoFactorSecret +twoFactorEnabled +twoFactorBackupCodes +password +failedLoginAttempts +lockUntil +mustChangePassword",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: "2FA is not enabled for this user",
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: "Account is locked",
        code: "ACCOUNT_LOCKED",
      });
    }

    // Verify 2FA token or backup code
    let isValid = false;

    if (token) {
      isValid = verifyToken(token, user.twoFactorSecret);
    } else if (backupCode) {
      isValid = await user.verifyBackupCode(backupCode);
    }

    if (!isValid) {
      // Increment failed login attempts for 2FA failure
      await user.incrementFailedLogin();

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
        details: { action: "2fa_login_failed", reason: "invalid_token" },
        success: false,
        errorMessage: "Invalid 2FA token",
        correlationId: req.id,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid 2FA token or backup code",
      });
    }

    // Reset failed login attempts
    await user.resetFailedLogin();

    // Generate token
    const { generateToken } = await import("#/shared/utils/jwt.js");
    const authToken = generateToken(user);

    // Get hotel info
    let hotelName = null;
    if (user.hotelId) {
      const Hotel = (await import("#/modules/hotels/models/Hotel.js")).default;
      const hotel = await Hotel.findById(user.hotelId).select("name");
      hotelName = hotel?.name ?? null;
    }

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
      details: { method: "2fa" },
      success: true,
      correlationId: req.id,
    });

    logger.info({ userId }, "2FA login successful");

    return res.status(200).json({
      success: true,
      message: "2FA verification successful",
      data: {
        token: authToken,
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          role: user.role,
          hotelId: user.hotelId,
          hotelName,
          mustChangePassword: user.mustChangePassword,
        },
      },
    });
  } catch (error) {
    logger.error(error, "Verify 2FA login error");
    return res.status(500).json({
      success: false,
      message: "Failed to verify 2FA",
    });
  }
};
