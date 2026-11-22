import mongoose from "mongoose";

const refundSchema = new mongoose.Schema(
  {
    refundId: { type: String, required: true, unique: true },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
      required: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },
    amount: { type: Number, required: true },
    reason: { type: String, default: "" },
    paymentMethod: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "completed", "rejected"],
      default: "pending",
    },
    requestedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    notes: { type: String, default: "" },

    billNo: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("Refund", refundSchema);
