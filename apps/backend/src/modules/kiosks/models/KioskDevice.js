import mongoose from "mongoose";

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
    pairCode: {
      type: String,
      trim: true,
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
  { timestamps: true },
);

kioskDeviceSchema.index({ hotelId: 1, deviceId: 1 }, { unique: true });

const KioskDevice = mongoose.model("KioskDevice", kioskDeviceSchema);
export default KioskDevice;
