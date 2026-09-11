import mongoose from "mongoose";

const serviceRequestSchema = new mongoose.Schema(
  {
    guestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
    type: {
      type: String,
      enum: [
        "AMENITY",
        "HOUSEKEEPING",
        "RESTAURANT",
        "RECEPTION",
        "MAINTENANCE",
        "MEDICINE",
        "TRANSPORT",
        "SPA",
        "EMERGENCY",
        "LAUNDRY",
        "CONCIERGE",
        "WAKEUP_CALL",
        "ROOM_CONTROL",
        "FEEDBACK",
      ],
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    priority: {
      type: String,
      enum: ["normal", "high"],
      default: "normal",
    },
    description: { type: String, trim: true },
    items: { type: [String], default: [] },
    status: {
      type: String,
      enum: [
        "REQUESTED",
        "ACKNOWLEDGED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "REQUESTED",
    },
  },
  { timestamps: true },
);

serviceRequestSchema.index({ hotelId: 1, createdAt: -1 });

export default mongoose.model("ServiceRequest", serviceRequestSchema);
