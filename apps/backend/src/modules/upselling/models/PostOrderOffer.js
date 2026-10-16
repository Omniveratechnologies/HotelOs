import mongoose from "mongoose";

const postOrderOfferSchema = new mongoose.Schema(
  {
    triggerTiming: {
      type: String,
      enum: ["immediately", "5min", "10min"],
      default: "immediately",
    },
    offerType: {
      type: String,
      enum: ["singleItem", "bundle"],
      default: "singleItem",
    },
    validForMinutes: { type: Number, default: 10 },
    offerItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodItem",
      required: true,
    },
    offerPrice: { type: Number, required: true },
    displayPriority: { type: Number, default: 1 },
    status: { type: Boolean, default: true },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("PostOrderOffer", postOrderOfferSchema);
