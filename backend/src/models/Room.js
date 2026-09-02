import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, trim: true },
    type: { type: String, trim: true, default: "Standard" },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    status: {
      type: String,
      enum: ["AVAILABLE", "RESERVED", "OCCUPIED", "CLEANING"],
      default: "AVAILABLE",
    },
  },
  { timestamps: true }
);

roomSchema.index({ hotelId: 1, roomNumber: 1 }, { unique: true });

export default mongoose.model("Room", roomSchema);