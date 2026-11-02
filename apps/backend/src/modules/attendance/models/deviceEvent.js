import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

export const DEVICE_EVENT_TYPES = [
  "CREATED",
  "UPDATED",
  "REMOVED",
  "ONLINE",
  "OFFLINE",
  "WARNING",
  "SYNC_OK",
  "SYNC_FAILED",
  "COMMAND",
  "ALERT",
];

const deviceEventSchema = new Schema(
  {
    hotelId: { type: Schema.Types.ObjectId, required: true },
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: "AttendanceDevice",
      required: true,
    },
    type: { type: String, enum: DEVICE_EVENT_TYPES, required: true },
    message: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

deviceEventSchema.index({ hotelId: 1, createdAt: -1 });
deviceEventSchema.index({ deviceId: 1, createdAt: -1 });
deviceEventSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 3600 },
);

export const DeviceEvent =
  models.DeviceEvent || model("DeviceEvent", deviceEventSchema);
