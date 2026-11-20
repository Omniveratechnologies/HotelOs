import mongoose from "mongoose";
import { compare, hash } from "bcryptjs";

import { ROLES } from "#/shared/constants/roles.js";
import { GUEST_ID_TYPES } from "#/shared/constants/guest.js";

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

    idNumber: {
      type: String,
      default: "",
      trim: true,
    },

    nationality: {
      type: String,
      default: null,
      trim: true,
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
  },
  {
    timestamps: true,
  },
);

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

export default mongoose.model("User", userSchema);
