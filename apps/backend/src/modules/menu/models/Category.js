import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      // A category picker that hasn't been touched sends "" rather than
      // omitting the field — normalize that to null so Mongoose doesn't
      // throw a CastError trying to turn "" into an ObjectId.
      set: (v) => (v === "" || v === undefined ? null : v),
    },
    image: { type: String, default: "" },
    icon: { type: String, default: "utensils" },
    displayOrder: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    gstRate: { type: Number, default: 5 },
    cgstRate: { type: Number, default: 2.5 },
    sgstRate: { type: Number, default: 2.5 },
  },
  { timestamps: true },
);

export default mongoose.model("Category", categorySchema);
