import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

const segmentSchema = new Schema(
  {
    startTime: { type: String, required: true, match: HHMM },
    endTime: { type: String, required: true, match: HHMM },
  },
  { _id: false },
);

const staffShiftSchema = new Schema(
  {
    hotelId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 40 },
    startTime: { type: String, required: true, match: HHMM },
    endTime: { type: String, required: true, match: HHMM },
    segments: { type: [segmentSchema], default: [] },
    breakMinutes: { type: Number, default: 0, min: 0, max: 240 },
    graceMinutes: { type: Number, default: 10, min: 0, max: 120 },
    color: { type: String, default: "#3B82F6", match: /^#[0-9a-fA-F]{6}$/ },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

staffShiftSchema.index({ hotelId: 1, isActive: 1, sortOrder: 1 });

export const StaffShift =
  models.StaffShift || model("StaffShift", staffShiftSchema);
