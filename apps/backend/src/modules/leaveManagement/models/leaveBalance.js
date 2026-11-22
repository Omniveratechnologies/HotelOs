import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const leaveBalanceSchema = new Schema(
  {
    hotelId: { type: Schema.Types.ObjectId, required: true, index: true },
    staffId: { type: Schema.Types.ObjectId, ref: "Staff", required: true },
    leaveTypeId: {
      type: Schema.Types.ObjectId,
      ref: "LeaveType",
      required: true,
    },
    year: { type: Number, required: true, min: 2000, max: 2100 },
    allotted: { type: Number, required: true, min: 0 },
    used: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

leaveBalanceSchema.index(
  { staffId: 1, leaveTypeId: 1, year: 1 },
  { unique: true },
);

export const LeaveBalance =
  models.LeaveBalance || model("LeaveBalance", leaveBalanceSchema);
