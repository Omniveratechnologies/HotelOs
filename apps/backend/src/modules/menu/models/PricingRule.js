import mongoose from "mongoose";

const pricingRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    specialPrice: { type: Number, required: true },
    validDays: {
      type: [String],
      default: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
    status: { type: Boolean, default: true },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("PricingRule", pricingRuleSchema);
