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
      enum: [
        "DEMO_URL",
        "GUEST_CHECKIN",
        "TABLE_ORDER",
        "RECEPTIONIST_KIOSK",
        "CUSTOM_URL",
      ],
      default: "DEMO_URL",
    },
    // TODO: Replace demo URL with real embedded URL as per hotel setup (e.g. guest self check-in / table-order / room key dispense flow)
    assignedUrl: {
      type: String,
      trim: true,
      default: "https://example.com/demo-kiosk",
    },
    customUrl: {
      type: String,
      trim: true,
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
  { timestamps: true },
);

kioskDeviceSchema.index({ hotelId: 1, deviceId: 1 });

const KioskDevice = mongoose.model("KioskDevice", kioskDeviceSchema);
export default KioskDevice;
