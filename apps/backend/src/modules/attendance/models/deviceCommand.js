import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

export const COMMAND_TYPES = ["TEST_CONNECTION", "SYNC_NOW", "RESTART"];
export const COMMAND_STATUSES = [
  "PENDING",
  "SENT",
  "ACKED",
  "FAILED",
  "TIMEOUT",
];

const deviceCommandSchema = new Schema(
  {
    hotelId: { type: Schema.Types.ObjectId, required: true },
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: "AttendanceDevice",
      required: true,
      index: true,
    },
    type: { type: String, enum: COMMAND_TYPES, required: true },
    status: { type: String, enum: COMMAND_STATUSES, default: "PENDING" },
    result: { type: Schema.Types.Mixed, default: null },
    requestedBy: { type: String, default: "" },
    expiresAt: { type: Date, required: true },
    sentAt: { type: Date, default: null },
    ackedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

deviceCommandSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 7 * 24 * 3600 },
);

export const DeviceCommand =
  models.DeviceCommand || model("DeviceCommand", deviceCommandSchema);
