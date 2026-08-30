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

    floor: {
      type: Number,
      required: true,
      min: 0,
    },

    // Quick display info for who is currently in the room.
    // Full guest records live in the Guest model (Phase B2).
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

export const roomResponseDTO = (room) => ({
  id: room._id,
  roomNumber: room.roomNumber,
  floor: room.floor,
  type: room.type,
  status: room.status,
  rate: room.rate,
  currentGuest: room.currentGuest,
  checkIn: room.checkIn,
  checkOut: room.checkOut,
});

export default mongoose.model("Room", roomSchema);
