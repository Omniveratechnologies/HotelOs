import mongoose from "mongoose";

// Tracks which Aiosell codes a SUPER_ADMIN has manually created + approved in
// the Aiosell dashboard. Aiosell room TYPES (Room.roomCode) and rate plans
// (RatePlan.ratePlanCode) are created manually — there is no config CRUD API.
// key = (hotelId, kind, code); approved once, shared by every room/rate plan
// using that code. Room/RatePlan docs carry a denormalized `channelSyncStatus`
// so the UI can badge them without a join.

const APPROVAL_KINDS = ["ROOM", "RATE_PLAN"];

const APPROVAL_STATUSES = ["under_review", "completed"];

const channelApprovalSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },

    kind: {
      type: String,
      enum: APPROVAL_KINDS,
      required: true,
    },

    // Room.roomCode (kind ROOM) or RatePlan.ratePlanCode (kind RATE_PLAN).
    code: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    status: {
      type: String,
      enum: APPROVAL_STATUSES,
      default: "under_review",
    },

    // SUPER_ADMIN user id who approved the code.
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

channelApprovalSchema.index({ hotelId: 1, kind: 1, code: 1 }, { unique: true });

export default mongoose.model("ChannelApproval", channelApprovalSchema);
