import mongoose from "mongoose";

const ROOM_TYPES = ["Standard", "Deluxe", "Suite"];

const ROOM_STATUSES = ["available", "occupied", "reserved", "cleaning"];

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ROOM_TYPES,
      required: true,
    },

    status: {
      type: String,
      enum: ROOM_STATUSES,
      default: "available",
    },

    rate: {
      type: Number,
      required: true,
      min: 0,
    },

    // Aiosell room TYPE code (e.g. "executive", "suite").
    // Shared by all rooms of the same `type`; set during channel manager
    // onboarding (read from Aiosell property_details).
    roomCode: { type: String, trim: true, default: null },

    floor: {
      type: Number,
      required: true,
      min: 0,
    },

    // Quick display info for who is currently in the room.
    // Full guest stay details live in the Booking model.
    currentGuest: {
      type: String,
      default: null,
      trim: true,
    },

    checkIn: {
      type: Date,
      default: null,
    },

    checkOut: {
      type: Date,
      default: null,
    },

    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// A room number must be unique within one hotel
roomSchema.index({ hotelId: 1, roomNumber: 1 }, { unique: true });

export default mongoose.model("Room", roomSchema);
