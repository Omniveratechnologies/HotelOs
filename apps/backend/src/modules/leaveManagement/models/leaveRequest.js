import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

export const LEAVE_STATUSES = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

const leaveRequestSchema = new Schema(
  {
    hotelId: { type: Schema.Types.ObjectId, required: true, index: true },
    staffId: { type: Schema.Types.ObjectId, ref: "Staff", required: true },

    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "StaffDepartment",
      default: null,
    },
    designationId: {
      type: Schema.Types.ObjectId,
      ref: "StaffDesignation",
      default: null,
    },
    leaveTypeId: {
      type: Schema.Types.ObjectId,
      ref: "LeaveType",
      required: true,
    },

    fromDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    toDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },

    days: { type: Number, required: true, min: 1 },

    workingDays: { type: Number, required: true, min: 1 },

    workingDaysByYear: {
      type: [new Schema({ year: Number, days: Number }, { _id: false })],
      default: [],
    },

    reason: { type: String, required: true, trim: true, maxlength: 500 },
    attachmentUrl: { type: String, trim: true, maxlength: 500, default: "" },

    status: { type: String, enum: LEAVE_STATUSES, default: "PENDING" },
    appliedAt: { type: Date, default: Date.now },
    appliedBy: { type: String, default: "" }, // name of whoever typed it in (until login exists)

    approverId: { type: Schema.Types.ObjectId, default: null },
    approverName: { type: String, default: "" },
    decidedAt: { type: Date, default: null },
    remarks: { type: String, trim: true, maxlength: 300, default: "" },
  },
  { timestamps: true },
);

leaveRequestSchema.index({ hotelId: 1, appliedAt: -1 });
leaveRequestSchema.index({ hotelId: 1, status: 1 });
leaveRequestSchema.index({ staffId: 1, fromDate: 1, toDate: 1 });

export const LeaveRequest =
  models.LeaveRequest || model("LeaveRequest", leaveRequestSchema);
