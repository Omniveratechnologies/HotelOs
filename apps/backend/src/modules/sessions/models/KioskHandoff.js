import mongoose from "mongoose";

const kioskHandoffSchema = new mongoose.Schema(
  {
    codeHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    kioskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KioskDevice",
      required: true,
      index: true,
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    targetDashboard: {
      type: String,
      required: true,
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      default: null,
    },
    consumed: {
      type: Boolean,
      default: false,
      index: true,
    },
    consumedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// TTL index to automatically purge handoff codes 5 minutes after expiration
kioskHandoffSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 300 });

export default mongoose.model("KioskHandoff", kioskHandoffSchema);
