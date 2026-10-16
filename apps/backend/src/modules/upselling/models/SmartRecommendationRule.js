import mongoose from "mongoose";

const smartRuleSchema = new mongoose.Schema(
  {
    category: { type: String, default: "" },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodItem",
      default: null,
    },
    minOrderValue: { type: Number, default: 0 },
    timeOfDay: { type: String, default: "All Day" },
    dayOfWeek: { type: String, default: "All Days" },
    tableType: { type: String, default: "Any" },
    showIfNotOrderedBefore: { type: Boolean, default: false },
    onlyIfInStock: { type: Boolean, default: true },
    maxPrepTimeMinutes: { type: Number, default: null },
    weatherEvent: { type: String, default: "" },
    limitFrequency: { type: Boolean, default: false },
    maxPerOrder: { type: Number, default: 1 },
    status: { type: Boolean, default: true },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("SmartRecommendationRule", smartRuleSchema);
