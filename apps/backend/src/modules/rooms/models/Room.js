import mongoose from "mongoose";

const ROOM_STATUSES = ["available", "occupied", "reserved", "cleaning"];

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },

    // The room type as Aiosell's config calls it (e.g. "Executive", "Suite").
    // Free text so the property mapping from Aiosell is honoured verbatim.
    type: {
      type: String,
      required: true,
      trim: true,
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

    // "under_review" until a SUPER_ADMIN creates + approves the roomCode in the
    // Aiosell dashboard (see ChannelApproval model); only approved codes sync.
    channelSyncStatus: {
      type: String,
      enum: ["under_review", "completed"],
      default: "completed",
    },

    // True while a delete request for this room is under review. The room stays
    // in the DB (its type's count still includes it) but is blocked from
    // check-in/reserve until the super-admin drops the count in Aiosell and
    // verifies; verifyCodeApproval then removes the record.
    pendingDelete: {
      type: Boolean,
      default: false,
    },

    // True once the room has been verified against Aiosell at least once (or
    // was imported/created directly from Aiosell). A staff-added room starts
    // false and is blocked from check-in/reserve until a super-admin verifies
    // it. Edits never reset this, so existing rooms keep running.
    channelVerified: {
      type: Boolean,
      default: true,
    },

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
