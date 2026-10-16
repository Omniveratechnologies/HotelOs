import mongoose from "mongoose";

const billingEntitySchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: [
        "invoice",
        "tax-rule",
        "company",
        "company-payment",
        "city-ledger",
        "receivable",
        "receivable-payment",
        "reminder",
        "write-off",
        "payable",
        "vendor-payment",
        "cash-movement",
        "cash-count",
        "external-transaction",
        "reconciliation-discrepancy",
        "reconciliation-lock",
        "night-audit-step",
        "expense",
        "recurring-expense",
        "deposit",
        "discrepancy",
        "audit-log",
      ],
      required: true,
      index: true,
    },
    status: { type: String, default: "draft", index: true },
    reference: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    businessDate: { type: Date, default: Date.now, index: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

billingEntitySchema.index({ hotelId: 1, entityType: 1, reference: 1 });

export default mongoose.model("BillingEntity", billingEntitySchema);
