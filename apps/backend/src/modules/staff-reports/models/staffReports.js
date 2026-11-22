import mongoose from "mongoose";

export const HOTEL_TZ = process.env.HOTEL_TIMEZONE || "Asia/Kolkata";

export const MODELS = {
  attendance: "Attendance",
  staff: "Staff",
  department: "Department",
  designation: "Designation",
  device: "AttendanceDevice",
};

export const A = {
  hotel: "hotelId",
  staff: "staffId",
  date: "date",
  status: "status",
  checkIn: "checkIn",
  checkOut: "checkOut",
  workMinutes: "workMinutes",
  department: "departmentId",
  designation: "designationId",
  device: "deviceId",
  shiftEnd: "shiftEnd",
};

export const EARLY_LEAVE_TOLERANCE_MIN = 15;

export const S = {
  hotel: "hotelId",
  code: "staffId",
  name: "name",
  photo: "photoUrl",
  department: "departmentId",
  designation: "designationId",
};
export const ACTIVE_STAFF = { status: /^active$/i };

export const D = {
  name: "name",
  onlinePercent: "uptimePercent",
};

export const getModel = (key, { optional = false } = {}) => {
  const model = mongoose.models[MODELS[key]];
  if (model) return model;
  if (optional) return null;
  const err = new Error(
    `Model "${MODELS[key]}" (${key}) is not registered. Set MODELS.${key} in dailyReport.adapter.js to one of: ${mongoose.modelNames().join(", ") || "(none loaded)"}`,
  );
  err.status = 500;
  err.statusCode = 500;
  throw err;
};
