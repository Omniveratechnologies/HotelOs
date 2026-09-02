import mongoose from "mongoose";

const serviceRequestSchema = new mongoose.Schema(
  {
    guestId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
    type: {
      type: String,
      enum: ["AMENITY", "HOUSEKEEPING", "RESTAURANT", "RECEPTION", "MAINTENANCE"],
      required: true,
    },
    description: { type: String, trim: true },
    items: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["REQUESTED", "ACKNOWLEDGED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      default: "REQUESTED",
    },
  },
  { timestamps: true }
);

export default mongoose.model("ServiceRequest", serviceRequestSchema);