import { model, Schema } from "mongoose";

// Global Aiosell configuration — a singleton (one document per platform
// deployment). Holds the PARTNER credentials (pmsSlug + Basic Auth pair) and
// the API base URL, all stored in the DB so no env vars are required and every
// credential is manageable via the SUPER_ADMIN config API. Per-hotel Aiosell
// identifiers live on Hotel (aiosellHotelCode), NOT here.
const channelManagerConfigSchema = new Schema(
  {
    pmsSlug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    username: { type: String, required: true, trim: true },
    password: { type: String, required: true, select: false },
    baseUrl: {
      type: String,
      required: true,
      trim: true,
      default: "https://live.aiosell.com/api/v2/cm",
    },
    isEnabled: { type: Boolean, default: false },
    lastSyncAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default model("ChannelManagerConfig", channelManagerConfigSchema);
