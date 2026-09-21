import { model, Schema } from "mongoose";

const OCCUPANCY_TYPES = ["single", "double", "triple", "quad"];
const MEAL_PLANS = ["EP", "AP", "MAP", "CP", "BP"];

// A sellable rate plan for a room type. ratePlanCode maps 1:1 to Aiosell's
// rateplanCode (e.g. "executive-s-ep" = Executive, single, room-only), so once
// synced, rates push without any transformation.
const ratePlanSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    ratePlanCode: { type: String, required: true, trim: true, lowercase: true },
    roomCode: { type: String, required: true, trim: true, lowercase: true },
    // Room type as Aiosell's config calls it (verbatim from property_details).
    roomType: { type: String, required: true, trim: true },
    rate: { type: Number, required: true, min: 0 },
    occupancy: { type: String, enum: OCCUPANCY_TYPES, required: true },
    mealPlan: { type: String, enum: MEAL_PLANS, default: "EP" },
    hotelId: {
      type: Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    isActive: { type: Boolean, default: true },
    // "under_review" until a SUPER_ADMIN creates + approves the ratePlanCode in
    // the Aiosell dashboard (see ChannelApproval model); only approved codes
    // sync.
    channelSyncStatus: {
      type: String,
      enum: ["under_review", "completed"],
      default: "completed",
    },
  },
  { timestamps: true },
);

// A rate plan code must be unique within one hotel
ratePlanSchema.index({ hotelId: 1, ratePlanCode: 1 }, { unique: true });

export default model("RatePlan", ratePlanSchema);
