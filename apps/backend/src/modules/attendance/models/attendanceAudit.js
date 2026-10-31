import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const attendanceAuditSchema = new Schema(
  {
    hotelId: { type: Schema.Types.ObjectId, required: true, index: true },
    attendanceId: {
      type: Schema.Types.ObjectId,
      ref: "AttendanceRecord",
      required: true,
      index: true,
    },
    staffId: { type: Schema.Types.ObjectId, ref: "Staff", required: true },
    action: { type: String, enum: ["CREATE", "CORRECTION"], required: true },
    changes: [
      {
        _id: false,
        field: String,
        from: Schema.Types.Mixed,
        to: Schema.Types.Mixed,
      },
    ],
    reason: { type: String, required: true, trim: true, maxlength: 300 },
    changedBy: { type: Schema.Types.ObjectId, default: null }, // req.user._id when login exists
    changedByName: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const AttendanceAudit =
  models.AttendanceAudit || model("AttendanceAudit", attendanceAuditSchema);
