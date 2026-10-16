import mongoose from "mongoose";

const upsellEventSchema = new mongoose.Schema(
  {
    ruleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UpsellRule",
      default: null,
    },
    postOrderOfferId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PostOrderOffer",
      default: null,
    },
    eventType: {
      type: String,
      enum: ["impression", "click", "addToCart", "accepted"],
      required: true,
    },
    revenue: { type: Number, default: 0 },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("UpsellEvent", upsellEventSchema);
