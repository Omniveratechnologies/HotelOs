import mongoose from "mongoose";

const invoiceSeriesSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    type: {
      type: String,
      enum: ["tax", "proforma", "receipt", "credit_note", "corporate"],
      required: true,
    },
    financialYear: { type: String, required: true },
    prefix: { type: String, required: true },
    lastNumber: { type: Number, default: 1000 },
  },
  { timestamps: true },
);

invoiceSeriesSchema.index(
  { hotelId: 1, type: 1, financialYear: 1 },
  { unique: true },
);

export default mongoose.model("InvoiceSeries", invoiceSeriesSchema);
