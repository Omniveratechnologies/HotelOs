import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const notificationSchema = new Schema(
  {
    hotelId: { type: Schema.Types.ObjectId, required: true },
    recipientType: {
      type: String,
      enum: ["STAFF", "APPROVER"],
      required: true,
    },
    recipientId: { type: Schema.Types.ObjectId, default: null },
    type: { type: String, required: true }, // LEAVE_APPLIED, LEAVE_APPROVED, ...
    title: { type: String, required: true, maxlength: 120 },
    message: { type: String, default: "", maxlength: 300 },
    ref: {
      kind: { type: String, default: "" },
      id: { type: Schema.Types.ObjectId, default: null },
    },
    readAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

notificationSchema.index({
  hotelId: 1,
  recipientType: 1,
  recipientId: 1,
  createdAt: -1,
});
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 3600 },
);

export const Notification =
  models.Notification || model("Notification", notificationSchema);
