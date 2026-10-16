import mongoose from "mongoose";

const fastItemSchema = new mongoose.Schema(
  {
    foodItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodItem",
      required: true,
    },
    prepTimeMinutes: { type: Number, default: 2 },
    offerPrice: { type: Number, default: null },
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

export default mongoose.model("FastItem", fastItemSchema);
