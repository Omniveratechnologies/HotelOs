import mongoose from "mongoose";

const splitSchema = new mongoose.Schema(
  {
    method: String,
    amount: Number,
    referenceNo: String,
    status: { type: String, default: "success" },
  },
  { _id: false },
);

const paymentSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true },
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
    method: {
      type: String,
      enum: [
        "cash",
        "card",
        "upi",
        "netbanking",
        "wallet",
        "room",
        "split",
        "complimentary",
      ],
      required: true,
    },
    amount: { type: Number, required: true },
    referenceNo: { type: String, default: "" },
    status: {
      type: String,
      enum: ["success", "pending", "failed"],
      default: "success",
    },
    source: {
      type: String,
      enum: ["desk", "online", "manual", "pos"],
      default: "desk",
    },
    gateway: { type: String, default: "" },
    gatewayTxnId: { type: String, default: "" },
    cardLast4: { type: String, default: "" },
    cashierShiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BillingWorkflow",
      default: null,
    },
    businessDate: { type: Date, default: Date.now, index: true },
    idempotencyKey: { type: String, default: "" },
    splitPayments: { type: [splitSchema], default: [] },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    device: { type: String, default: "" },
    location: { type: String, default: "" },
    notes: { type: String, default: "" },
    billNo: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("Payment", paymentSchema);
