import mongoose from "mongoose";

// Tracks under-review change requests for Aiosell. Rooms, rate plans, room
// types, and hotel/property details are created and edited manually in the
// Aiosell dashboard � there is no config CRUD API. When a SUB_ADMIN or
// RECEPTIONIST creates or edits an entity, a request is recorded as
// "under_review" storing ONLY the delta/updates (not full snapshots).
// A SUPER_ADMIN executes the change manually in Aiosell, then clicks Verify.
// The backend checks whether the change is live in Aiosell; if present, it
// triggers an auto-sync and completes the request.

export const APPROVAL_KINDS = ["ROOM", "RATE_PLAN", "ROOM_TYPE", "HOTEL"];
export const APPROVAL_STATUSES = ["under_review", "completed"];
export const APPROVAL_ACTIONS = ["create", "update", "delete"];

const channelApprovalSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },

    kind: {
      type: String,
      enum: APPROVAL_KINDS,
      required: true,
    },

    // create = entity is new and must be added in Aiosell
    // update = existing values changed
    // delete = entity/room must be removed
    action: {
      type: String,
      enum: APPROVAL_ACTIONS,
      default: "update",
    },

    // Room.roomCode, RatePlan.ratePlanCode, RoomType.roomCode, or "property" for HOTEL
    code: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    // For kind ROOM: the specific Room target (null for other kinds)
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      default: null,
    },

    // Denormalized room number for display
    roomNumber: {
      type: String,
      trim: true,
      default: null,
    },

    status: {
      type: String,
      enum: APPROVAL_STATUSES,
      default: "under_review",
      index: true,
    },

    // USER (SUB_ADMIN/RECEPTIONIST) who initiated the change
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Optimized storage: ONLY the fields that are being added or modified
    // For 'create': { name, count, rate, etc. }
    // For 'update': { fieldName: { from: oldVal, to: newVal } } or changed values
    // For 'delete': { targetCount: number, previousCode: string }
    updates: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },

    // Verification attempts and latest feedback
    verifyAttempts: {
      type: Number,
      default: 0,
    },

    lastVerifyResult: {
      type: String,
      default: null,
    },

    verifyComparison: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    lastVerifyMessage: {
      type: String,
      default: null,
    },

    // SUPER_ADMIN user id who completed the request via Verify
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// One request per room (kind ROOM), rate-plan code, room-type code, or hotel property
channelApprovalSchema.index(
  { hotelId: 1, kind: 1, code: 1, roomId: 1 },
  { unique: true },
);

export default mongoose.model("ChannelApproval", channelApprovalSchema);
