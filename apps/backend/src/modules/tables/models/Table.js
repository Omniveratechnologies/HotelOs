import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
  {
    tableNumber: { type: String, required: true, trim: true },
    seats: { type: Number, required: true },
    section: { type: String, trim: true, default: "Main Hall" },
    status: {
      type: String,
      enum: ["AVAILABLE", "OCCUPIED", "RESERVED"],
      default: "AVAILABLE",
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
  },
  { timestamps: true },
);

tableSchema.index({ hotelId: 1, tableNumber: 1 }, { unique: true });

export default mongoose.model("Table", tableSchema);
