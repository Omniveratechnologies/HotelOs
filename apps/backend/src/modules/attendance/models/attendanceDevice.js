import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

export const DEVICE_TYPES = ["FACE_RECOGNITION", "FINGERPRINT", "RFID"];
export const DEVICE_STATUSES = ["ONLINE", "OFFLINE", "WARNING"];

const attendanceDeviceSchema = new Schema(
  {
    hotelId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },

    deviceCode: { type: String, required: true, trim: true, uppercase: true },
    type: { type: String, enum: DEVICE_TYPES, required: true },

    location: { type: String, required: true, trim: true, maxlength: 80 },
    ipAddress: { type: String, trim: true, default: "" },
    firmwareVersion: { type: String, trim: true, default: "" },

    status: { type: String, enum: DEVICE_STATUSES, default: "OFFLINE" },
    statusChangedAt: { type: Date, default: null },

    lastSeenAt: { type: Date, default: null },
    lastSyncAt: { type: Date, default: null },
    alertedAt: { type: Date, default: null },
    consecutiveSyncErrors: { type: Number, default: 0, min: 0 },

    config: { type: Schema.Types.Mixed, default: {} },

    mapX: { type: Number, min: 0, max: 100, default: null },
    mapY: { type: Number, min: 0, max: 100, default: null },

    tokenHash: { type: String, default: "", index: true },

    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

attendanceDeviceSchema.index(
  { hotelId: 1, deviceCode: 1, deletedAt: 1 },
  { unique: true },
);

export const AttendanceDevice =
  models.AttendanceDevice || model("AttendanceDevice", attendanceDeviceSchema);
