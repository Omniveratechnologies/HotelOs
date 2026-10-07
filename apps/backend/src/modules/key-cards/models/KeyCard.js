import mongoose from "mongoose";

const keyCardAuditSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: [
        "CREATED",
        "ASSIGNED",
        "REISSUED",
        "BLOCKED",
        "RETURNED",
        "DEACTIVATED",
      ],
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    performedAt: {
      type: Date,
      default: Date.now,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    note: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { _id: false },
);

const keyCardSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },
    cardNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    keyType: {
      type: String,
      enum: ["RFID_CARD", "PHYSICAL_KEY", "MOBILE_KEY"],
      default: "RFID_CARD",
    },
    status: {
      type: String,
      enum: ["AVAILABLE", "ACTIVE", "LOST", "DAMAGED", "DEACTIVATED"],
      default: "AVAILABLE",
      index: true,
    },
    currentBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    assignedGuestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      default: null,
    },
    issuedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    auditLog: {
      type: [keyCardAuditSchema],
      default: [],
    },
  },
  { timestamps: true },
);

keyCardSchema.index({ hotelId: 1, cardNumber: 1 }, { unique: true });

const KeyCard = mongoose.model("KeyCard", keyCardSchema);
export default KeyCard;
