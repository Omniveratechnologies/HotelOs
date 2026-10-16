import mongoose from "mongoose";

const workflowSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["cashier-shift", "reconciliation", "night-audit"],
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "running", "completed", "closed"],
      default: "open",
    },
    businessDate: { type: Date, default: Date.now },
    openingFloat: { type: Number, default: 0 },
    closingCash: { type: Number, default: null },
    variance: { type: Number, default: null },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    openedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

workflowSchema.index({ hotelId: 1, type: 1, status: 1 });

export default mongoose.model("BillingWorkflow", workflowSchema);
