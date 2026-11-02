import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const designationSchema = new Schema(
  {
    hotelId: { type: Schema.Types.ObjectId, required: true },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "StaffDepartment",
      required: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    code: { type: String, trim: true, uppercase: true },
    description: { type: String, trim: true, maxlength: 300, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

designationSchema.index(
  { hotelId: 1, departmentId: 1, name: 1 },
  { unique: true },
);
designationSchema.index(
  { hotelId: 1, code: 1 },
  { unique: true, partialFilterExpression: { code: { $type: "string" } } },
);

if (models.StaffDesignation && !models.StaffDesignation.schema.path("code")) {
  throw new Error(
    'Old StaffDesignation model found. In models/staffManagement.js delete designationSchema and its model, and add: export { StaffDesignation } from "./staffDesignation.js";',
  );
}

export const StaffDesignation =
  models.StaffDesignation || model("StaffDesignation", designationSchema);
