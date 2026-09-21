import { model, Schema } from "mongoose";

const roomTypeSchema = new Schema(
  {
    hotelId: {
      type: Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    roomCode: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    count: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    active: {
      type: Boolean,
      default: true,
    },
    minOccupancy: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    maxOccupancy: {
      type: Number,
      default: null,
    },
    channelSyncStatus: {
      type: String,
      enum: ["under_review", "completed"],
      default: "completed",
    },
  },
  { timestamps: true },
);

roomTypeSchema.index({ hotelId: 1, roomCode: 1 }, { unique: true });

export default model("RoomType", roomTypeSchema);
