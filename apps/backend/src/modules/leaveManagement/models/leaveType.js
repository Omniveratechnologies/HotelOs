import mongoose from "mongoose";

const { Schema, model, models } = mongoose;
const leaveTypeSchema = new Schema(
  {
    hotelId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 40 },
    annualQuota: { type: Number, default: 0, min: 0, max: 366 },
    isPaid: { type: Boolean, default: true },
    color: { type: String, default: "#3b82f6", match: /^#[0-9a-fA-F]{6}$/ },

    minNoticeDays: { type: Number, default: 1, min: 0, max: 90 },
    attachmentAfterDays: { type: Number, default: null, min: 0, max: 366 },

    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

leaveTypeSchema.index({ hotelId: 1, name: 1 }, { unique: true });

export const LeaveType =
  models.LeaveType || model("LeaveType", leaveTypeSchema);
