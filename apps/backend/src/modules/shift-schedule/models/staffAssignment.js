import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

export const ASSIGNMENT_SOURCES = ["MANUAL", "BULK", "AUTO"];

const shiftAssignmentSchema = new Schema(
  {
    hotelId: { type: Schema.Types.ObjectId, required: true, index: true },
    staffId: { type: Schema.Types.ObjectId, ref: "Staff", required: true },
  
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    shiftId: { type: Schema.Types.ObjectId, ref: "StaffShift", default: null },
    source: { type: String, enum: ASSIGNMENT_SOURCES, default: "MANUAL" },
    assignedByName: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

shiftAssignmentSchema.index(
  { hotelId: 1, staffId: 1, date: 1 },
  { unique: true },
);
shiftAssignmentSchema.index({ hotelId: 1, date: 1, shiftId: 1 });
shiftAssignmentSchema.index({ hotelId: 1, shiftId: 1, date: 1 });

export const ShiftAssignment =
  models.ShiftAssignment || model("ShiftAssignment", shiftAssignmentSchema);
