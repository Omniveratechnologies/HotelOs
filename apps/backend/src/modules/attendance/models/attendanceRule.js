import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const attendanceRuleSchema = new Schema(
  {
    hotelId: { type: Schema.Types.ObjectId, required: true, unique: true },

    graceMinutes: { type: Number, default: 10, min: 0, max: 240 },

    defaultBreakMinutes: { type: Number, default: 0, min: 0, max: 240 },
  },
  { timestamps: true },
);

export const AttendanceRule =
  models.AttendanceRule || model("AttendanceRule", attendanceRuleSchema);
