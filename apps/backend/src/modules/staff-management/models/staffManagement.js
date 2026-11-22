import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

export { StaffDesignation } from "./staffDesignation.js";

const departmentSchema = new Schema(
  {
    hotelId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true },
    description: { type: String, trim: true, maxlength: 300, default: "" },
    icon: { type: String, trim: true, default: "building" },
    color: { type: String, trim: true, default: "#3b82f6" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
departmentSchema.index({ hotelId: 1, name: 1 }, { unique: true });
departmentSchema.index(
  { hotelId: 1, code: 1 },
  { unique: true, partialFilterExpression: { code: { $type: "string" } } },
);

const staffSchema = new Schema(
  {
    hotelId: { type: Schema.Types.ObjectId, required: true, index: true },
    staffCode: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: "" },
    dob: { type: Date, default: null },
    address: { type: String, trim: true, default: "" },
    govIdType: { type: String, default: "" },
    govIdEnc: { type: String, default: "" },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "StaffDepartment",
      // required: true,
    },
    designationId: {
      type: Schema.Types.ObjectId,
      ref: "StaffDesignation",
      // required: true,
    },
    shiftId: {
      type: Schema.Types.ObjectId,
      ref: "StaffShift",
      default: null,
    },
    managerId: { type: Schema.Types.ObjectId, ref: "Staff", default: null },
    employmentType: {
      type: String,
      enum: ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"],
      default: "FULL_TIME",
    },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    joinedOn: { type: Date, default: Date.now, required: true },
    photoUrl: { type: String, default: "" },
    notes: { type: String, trim: true, default: "" },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);
staffSchema.index({ hotelId: 1, staffCode: 1 }, { unique: true });
staffSchema.index({ hotelId: 1, departmentId: 1 });
staffSchema.index({ hotelId: 1, status: 1 });
staffSchema.index({ hotelId: 1, phone: 1 }, { unique: true });
staffSchema.index({ hotelId: 1, name: 1 });

const faceSchema = new Schema(
  {
    hotelId: { type: Schema.Types.ObjectId, required: true, index: true },
    staffId: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
      index: true,
    },
    embeddingRef: { type: String, required: true },
  },
  { timestamps: true },
);

export const StaffDepartment =
  models.StaffDepartment || model("StaffDepartment", departmentSchema);
export const Staff = models.Staff || model("Staff", staffSchema);
export const FaceEmbedding =
  models.FaceEmbedding || model("FaceEmbedding", faceSchema);
