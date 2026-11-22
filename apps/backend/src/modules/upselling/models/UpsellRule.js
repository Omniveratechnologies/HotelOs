import mongoose from "mongoose";

const upsellRuleSchema = new mongoose.Schema(
  {
    triggerItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodItem",
      required: true,
    },
    type: { type: String, enum: ["upsell", "combo", "addon"], required: true },
    recommendedItems: {
      type: [
        {
          foodItemId: { type: mongoose.Schema.Types.ObjectId, ref: "FoodItem" },
          name: String,
        },
      ],
      default: [],
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    status: { type: Boolean, default: true },
    // Combo-only fields
    bundlePrice: { type: Number, default: null },
    discountType: {
      type: String,
      enum: ["fixedAmount", "percentage"],
      default: "fixedAmount",
    },
    discountValue: { type: Number, default: 0 },
    minSelection: { type: Number, default: 1 },
    maxSelection: { type: Number, default: 1 },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("UpsellRule", upsellRuleSchema);
