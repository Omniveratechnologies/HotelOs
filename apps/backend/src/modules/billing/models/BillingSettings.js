import mongoose from "mongoose";

const billingSettingsSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      unique: true,
    },
    general: { type: mongoose.Schema.Types.Mixed, default: {} },
    invoice: { type: mongoose.Schema.Types.Mixed, default: {} },
    paymentSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    taxSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    receiptSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    cancellation: { type: mongoose.Schema.Types.Mixed, default: {} },
    discountPermissions: { type: mongoose.Schema.Types.Mixed, default: {} },
    rounding: { type: mongoose.Schema.Types.Mixed, default: {} },
    invoiceDelivery: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export default mongoose.model("BillingSettings", billingSettingsSchema);
