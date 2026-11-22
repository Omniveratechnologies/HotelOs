import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    amount: { type: mongoose.Schema.Types.Decimal128, required: true },
  },
  { _id: false },
);

const folioTransactionSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    guestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    source: { type: String, required: true, trim: true },
    outletId: { type: String, required: true, trim: true },
    sourceBillId: { type: String, required: true, trim: true },
    transactionType: {
      type: String,
      enum: ["CHARGE", "REVERSAL"],
      default: "CHARGE",
    },
    originalTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FolioTransaction",
      default: null,
    },
    items: { type: [itemSchema], default: [] },
    subtotal: { type: mongoose.Schema.Types.Decimal128, required: true },
    discount: { type: mongoose.Schema.Types.Decimal128, default: 0 },
    tax: { type: mongoose.Schema.Types.Decimal128, default: 0 },
    total: { type: mongoose.Schema.Types.Decimal128, required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["POSTED", "REVERSED"], default: "POSTED" },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    businessDate: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

folioTransactionSchema.index(
  { hotelId: 1, source: 1, outletId: 1, sourceBillId: 1 },
  { unique: true },
);

export default mongoose.model("FolioTransaction", folioTransactionSchema);
