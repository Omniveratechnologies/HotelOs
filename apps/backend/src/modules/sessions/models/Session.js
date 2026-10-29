import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["QR_GUEST", "KIOSK"],
      required: true,
      index: true,
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      default: null,
      index: true,
    },
    kioskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KioskDevice",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "REVOKED", "EXPIRED"],
      default: "ACTIVE",
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revocationReason: {
      type: String,
      default: null,
    },
    tableSessionGeneration: {
      type: Number,
      default: null,
    },
    csrfToken: {
      type: String,
      default: null,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

// TTL index to automatically purge expired sessions from MongoDB 24 hours after expiry
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.model("Session", sessionSchema);
