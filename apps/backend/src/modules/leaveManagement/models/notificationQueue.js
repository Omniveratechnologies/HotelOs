import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

export const QUEUE_CHANNELS = ["EMAIL", "SMS", "WHATSAPP"];

const notificationQueueSchema = new Schema(
  {
    hotelId: { type: Schema.Types.ObjectId, required: true },
    channel: { type: String, enum: QUEUE_CHANNELS, required: true },
    to: { type: String, required: true, maxlength: 120 }, // address or phone number
    subject: { type: String, default: "", maxlength: 150 },
    body: { type: String, required: true, maxlength: 1000 },
    ref: {
      kind: { type: String, default: "" },
      id: { type: Schema.Types.ObjectId, default: null },
    },

    status: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED"],
      default: "PENDING",
    },
    attempts: { type: Number, default: 0 },
    lastError: { type: String, default: "" },
    nextAttemptAt: { type: Date, default: Date.now },
    sentAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

notificationQueueSchema.index({ status: 1, nextAttemptAt: 1 });
notificationQueueSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 3600 },
);

export const NotificationQueue =
  models.NotificationQueue ||
  model("NotificationQueue", notificationQueueSchema);
