import mongoose from "mongoose";

const taxRuleSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    code: { type: String, default: "" },
    type: {
      type: String,
      enum: ["tax", "service_charge", "fixed_charge"],
      required: true,
    },
    rate: { type: Number, default: 0, min: 0, max: 100 },
    fixedAmount: { type: Number, default: 0, min: 0 },
    calcMethod: {
      type: String,
      enum: [
        "on_base",
        "on_base_plus_service",
        "per_room_per_night",
        "per_pax",
        "flat",
      ],
      default: "on_base",
    },
    applicableOn: {
      type: String,
      enum: ["room", "fnb", "service", "other"],
      required: true,
    },
    taxGroup: { type: String, default: "GST" },
    hsnSac: { type: String, default: "" },
    description: { type: String, default: "" },
    slabMin: { type: Number, default: null },
    slabMax: { type: Number, default: null },
    compound: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    effectiveFrom: { type: Date, default: Date.now },
    effectiveTo: { type: Date, default: null },
    version: { type: Number, default: 1 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

taxRuleSchema.index({ hotelId: 1, name: 1, applicableOn: 1, version: 1 });

export default mongoose.model("TaxRule", taxRuleSchema);
