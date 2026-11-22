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
    // Optional table-specific coordinates for fine-grained 50m proximity
    coordinates: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    // Monotonically increasing generation counter; incrementing resets active QR sessions
    sessionGeneration: {
      type: Number,
      default: 1,
    },
    // Allows staff to temporarily halt digital ordering on this table
    isOrderingEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

tableSchema.index({ hotelId: 1, tableNumber: 1 }, { unique: true });

export default mongoose.model("Table", tableSchema);
