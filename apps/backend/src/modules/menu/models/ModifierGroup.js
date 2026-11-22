import mongoose from "mongoose";

const modifierOptionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    image: { type: String, default: "" },
    price: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
    status: { type: Boolean, default: true },
  },
  { _id: true },
);

const modifierGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["single", "multi"], default: "single" },
    description: { type: String, trim: true, default: "" },
    image: { type: String, default: "" },
    displayOrder: { type: Number, default: 0 },
    status: { type: Boolean, default: true },
    required: { type: Boolean, default: false },
    minSelection: { type: Number, default: 0 },
    maxSelection: { type: Number, default: 1 },
    allowMultiple: { type: Boolean, default: false },
    options: { type: [modifierOptionSchema], default: [] },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("ModifierGroup", modifierGroupSchema);
