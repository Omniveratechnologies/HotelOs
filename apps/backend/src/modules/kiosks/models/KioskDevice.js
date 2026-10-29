import mongoose from "mongoose";
import { resolveKioskAssignedUrl } from "../config/kioskDashboards.js";

const kioskDeviceSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      default: "Main Lobby",
    },
    status: {
      type: String,
      enum: ["ONLINE", "OFFLINE", "MAINTENANCE", "DISABLED"],
      default: "ONLINE",
      index: true,
    },
    // Target dashboard / experience type controlled remotely from Super Admin
    targetDashboard: {
      type: String,
      enum: ["GUEST_DASHBOARD", "SELF_CHECKIN", "DIGITAL_MENU"],
      default: "GUEST_DASHBOARD",
    },
    // Optional dining table assignment (specifically when targetDashboard is DIGITAL_MENU)
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      default: null,
    },
    // One-time pairing code; cleared once device completes pairing
    pairCode: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    isPaired: {
      type: Boolean,
      default: false,
    },
    pairedAt: {
      type: Date,
      default: null,
    },
    ipAddress: {
      type: String,
      trim: true,
      default: null,
    },
    lastHeartbeat: {
      type: Date,
      default: Date.now,
    },
    batteryLevel: {
      type: Number,
      default: null,
    },
    appVersion: {
      type: String,
      trim: true,
      default: "1.0.0",
    },
    firmwareVersion: {
      type: String,
      trim: true,
      default: "v1.4.0",
    },
    supportedFeatures: {
      type: [String],
      default: ["CHECK_IN", "KEY_DISPENSE", "DOCUMENT_SCAN"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual property to dynamically resolve assignedUrl based on targetDashboard config without persisting in DB
kioskDeviceSchema.virtual("assignedUrl").get(function () {
  return resolveKioskAssignedUrl(this);
});

kioskDeviceSchema.index({ hotelId: 1, deviceId: 1 });

const KioskDevice = mongoose.model("KioskDevice", kioskDeviceSchema);
export default KioskDevice;
