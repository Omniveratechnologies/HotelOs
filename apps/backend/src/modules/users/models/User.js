import mongoose from "mongoose";
import { compare, hash } from "bcryptjs";

import { ROLES } from "#/shared/constants/roles.js";
import { GUEST_ID_TYPES } from "#/shared/constants/guest.js";
import { encrypt, decrypt } from "#/shared/services/encryption.service.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
    },

    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      default: null,
    },

    // Subscription is applicable to Sub Admin accounts
    subscriptionStartDate: {
      type: Date,
      default: null,
    },

    subscriptionEndDate: {
      type: Date,
      default: null,
    },

    // Guest profile (identity) — only meaningful for role GUEST
    phone: {
      type: String,
      default: "",
      trim: true,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    idType: {
      type: String,
      enum: GUEST_ID_TYPES,
      default: "Aadhaar",
    },

    // Encrypted sensitive fields
    idNumberEncrypted: {
      type: String,
      default: "",
      select: false,
    },

    nationalityEncrypted: {
      type: String,
      default: null,
      select: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    mustChangePassword: {
      type: Boolean,
      default: true,
    },

    // Account lockout for brute force protection
    failedLoginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    lockUntil: {
      type: Date,
      default: null,
      select: false,
    },

    documents: [
      {
        docType: {
          type: String,
          enum: GUEST_ID_TYPES,
          required: true,
        },
        filename: {
          type: String,
          required: true,
        },
        path: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Password recovery
    resetPasswordToken: {
      type: String,
      default: null,
      select: false,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
      select: false,
    },

    // Password history for reuse prevention (last 5 passwords)
    passwordHistory: [
      {
        password: { type: String, select: false },
        changedAt: { type: Date, default: Date.now },
      },
    ],

    // Two-Factor Authentication (2FA)
    twoFactorEnabled: {
      type: Boolean,
      default: false,
      select: false,
    },

    twoFactorSecret: {
      type: String,
      default: null,
      select: false,
    },

    twoFactorBackupCodes: [
      {
        code: { type: String, select: false },
        used: { type: Boolean, default: false },
        usedAt: { type: Date, default: null },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Virtual getters/setters for encrypted fields
userSchema
  .virtual("idNumber")
  .get(function () {
    if (!this.idNumberEncrypted) return "";
    try {
      return decrypt(this.idNumberEncrypted);
    } catch {
      return this.idNumberEncrypted; // Return as-is if decryption fails (legacy data)
    }
  })
  .set(function (value) {
    this.idNumberEncrypted = value ? encrypt(String(value)) : "";
  });

userSchema
  .virtual("nationality")
  .get(function () {
    if (!this.nationalityEncrypted) return null;
    try {
      return decrypt(this.nationalityEncrypted);
    } catch {
      return this.nationalityEncrypted;
    }
  })
  .set(function (value) {
    this.nationalityEncrypted = value ? encrypt(String(value)) : null;
  });

// Ensure virtuals are included in JSON
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

// Virtual for checking if account is locked
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  // Add current password to history before hashing new one
  if (this.isModified("password") && !this.isNew) {
    const currentPassword = this.get("password");
    if (currentPassword) {
      this.passwordHistory = this.passwordHistory || [];
      this.passwordHistory.unshift({
        password: currentPassword,
        changedAt: new Date(),
      });
      // Keep only last 5 passwords
      this.passwordHistory = this.passwordHistory.slice(0, 5);
    }
  }

  this.password = await hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (password) {
  return compare(password, this.password);
};

// Increment failed login attempts
userSchema.methods.incrementFailedLogin = async function () {
  this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;

  // Lock account after 5 failed attempts for 30 minutes
  if (this.failedLoginAttempts >= 5) {
    this.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
  }

  await this.save();
  return this;
};

// Reset failed login attempts on successful login
userSchema.methods.resetFailedLogin = async function () {
  if (this.failedLoginAttempts > 0 || this.lockUntil) {
    this.failedLoginAttempts = 0;
    this.lockUntil = null;
    await this.save();
  }
  return this;
};

// Check if password was used recently (prevent reuse)
userSchema.methods.isPasswordReused = async function (newPassword) {
  const checks = (this.passwordHistory || []).map((history) =>
    compare(newPassword, history.password),
  );
  const results = await Promise.all(checks);
  return results.some((match) => match);
};

// =====================================================
// TWO-FACTOR AUTHENTICATION METHODS
// =====================================================

// Generate new 2FA secret and backup codes
userSchema.methods.generateTwoFactor = function () {
  const { authenticator } = require("otplib");

  // Generate a new secret
  const secret = authenticator.generateSecret();

  // Generate backup codes (10 codes, 8 chars each)
  const backupCodes = [];
  for (let i = 0; i < 10; i++) {
    backupCodes.push({
      code: Math.random().toString(36).substring(2, 10).toUpperCase(),
      used: false,
      usedAt: null,
    });
  }

  this.twoFactorSecret = secret;
  this.twoFactorBackupCodes = backupCodes;
  this.twoFactorEnabled = false; // Not enabled until verified

  return { secret, backupCodes: backupCodes.map((b) => b.code) };
};

// Enable 2FA after successful verification
userSchema.methods.enableTwoFactor = async function () {
  this.twoFactorEnabled = true;
  await this.save();
  return this;
};

// Disable 2FA
userSchema.methods.disableTwoFactor = async function () {
  this.twoFactorEnabled = false;
  this.twoFactorSecret = null;
  this.twoFactorBackupCodes = [];
  await this.save();
  return this;
};

// Verify TOTP token
userSchema.methods.verifyTwoFactorToken = function (token) {
  if (!this.twoFactorEnabled || !this.twoFactorSecret) {
    return false;
  }

  const { authenticator } = require("otplib");
  return authenticator.check(token, this.twoFactorSecret);
};

// Verify and consume backup code
userSchema.methods.verifyBackupCode = async function (code) {
  const normalizedCode = code.toUpperCase().replace(/\s/g, "");

  const backupCode = this.twoFactorBackupCodes.find(
    (b) => b.code === normalizedCode && !b.used,
  );

  if (!backupCode) {
    return false;
  }

  backupCode.used = true;
  backupCode.usedAt = new Date();
  await this.save();

  return true;
};

// Regenerate backup codes
userSchema.methods.regenerateBackupCodes = async function () {
  const backupCodes = [];
  for (let i = 0; i < 10; i++) {
    backupCodes.push({
      code: Math.random().toString(36).substring(2, 10).toUpperCase(),
      used: false,
      usedAt: null,
    });
  }

  this.twoFactorBackupCodes = backupCodes;
  await this.save();

  return backupCodes.map((b) => b.code);
};

// Check if 2FA is required for this user's role
userSchema.methods.isTwoFactorRequired = function () {
  const requiredRoles = ["SUPER_ADMIN", "SUB_ADMIN", "RECEPTIONIST"];
  return requiredRoles.includes(this.role);
};

export default mongoose.model("User", userSchema);
