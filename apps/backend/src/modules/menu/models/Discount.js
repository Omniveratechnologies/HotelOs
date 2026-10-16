import mongoose from "mongoose";

const discountSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["percentage", "fixed", "buyXgetY", "combo"],
      default: "percentage",
    },
    value: { type: Number, default: 0 },
    conditions: { type: String, trim: true, default: "" },
    validity: { type: String, trim: true, default: "" },
    status: { type: Boolean, default: true },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Discount", discountSchema);
