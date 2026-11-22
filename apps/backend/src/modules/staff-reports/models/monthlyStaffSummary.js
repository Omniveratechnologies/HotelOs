import mongoose from "mongoose";

const { Schema } = mongoose;

const actorSchema = new Schema({ id: String, name: String }, { _id: false });
const eventSchema = new Schema(
  {
    action: { type: String, enum: ["LOCK", "UNLOCK"] },
    at: Date,
    by: actorSchema,
    note: String,
  },
  { _id: false },
);
const monthlyStaffSummarySchema = new Schema(
  {
    hotelId: { type: Schema.Types.Mixed, required: true },
    staffId: { type: Schema.Types.ObjectId, required: true },
    month: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    departmentId: { type: Schema.Types.ObjectId, default: null },

    present: { type: Number, default: 0 },
    late: { type: Number, default: 0 },
    halfDay: { type: Number, default: 0 },
    absent: { type: Number, default: 0 },
    onLeave: { type: Number, default: 0 },
    holiday: { type: Number, default: 0 },
    totalDays: { type: Number, default: 0 },
    workingDays: { type: Number, default: 0 },
    attendancePercent: { type: Number, default: null },

    computedAt: { type: Date },
    stale: { type: Boolean, default: false },
    locked: { type: Boolean, default: false },
    lockedAt: { type: Date },
    lockedBy: actorSchema,
    events: { type: [eventSchema], default: [] },
  },
  { timestamps: true },
);

monthlyStaffSummarySchema.index(
  { hotelId: 1, month: 1, staffId: 1 },
  { unique: true },
);
monthlyStaffSummarySchema.index({ hotelId: 1, month: 1, locked: 1 });

export const MonthlyStaffSummary =
  mongoose.models.MonthlyStaffSummary ||
  mongoose.model("MonthlyStaffSummary", monthlyStaffSummarySchema);
export default MonthlyStaffSummary;
