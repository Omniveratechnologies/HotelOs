import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

export const ATTENDANCE_STATUSES = [
  "PRESENT",
  "LATE",
  "ABSENT",
  "ON_LEAVE",
  "HOLIDAY",
];

const attendanceRecordSchema = new Schema(
  {
    hotelId: { type: Schema.Types.ObjectId, required: true, index: true },
    staffId: { type: Schema.Types.ObjectId, ref: "Staff", required: true },

    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },

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
    shiftId: { type: Schema.Types.ObjectId, ref: "StaffShift", default: null },

    checkInAt: { type: Date, default: null },
    checkOutAt: { type: Date, default: null },
    workMinutes: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ATTENDANCE_STATUSES, required: true },

    checkInDeviceId: { type: Schema.Types.ObjectId, default: null },
    checkOutDeviceId: { type: Schema.Types.ObjectId, default: null },
    confidence: { type: Number, min: 0, max: 1, default: null },

    source: {
      type: String,
      enum: ["face", "manual", "system"],
      default: "face",
    },
    remarks: { type: String, trim: true, maxlength: 300, default: "" },

    lastEventAt: { type: Date, default: null },
  },
  { timestamps: true },
);

attendanceRecordSchema.index({ staffId: 1, date: 1 }, { unique: true });
attendanceRecordSchema.index({ hotelId: 1, date: 1, status: 1 });
attendanceRecordSchema.index({ hotelId: 1, date: 1, departmentId: 1 });
attendanceRecordSchema.index({ hotelId: 1, lastEventAt: -1 });

export const AttendanceRecord =
  models.AttendanceRecord || model("AttendanceRecord", attendanceRecordSchema);
