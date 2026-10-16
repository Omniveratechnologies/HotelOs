import mongoose from "mongoose";

const chargeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["fixed", "percentage"], default: "fixed" },
    value: { type: Number, default: 0 },
    applicableTo: {
      type: [String],
      default: ["dine-in", "takeaway", "delivery", "room-service"],
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

export default mongoose.model("Charge", chargeSchema);
