import mongoose from "mongoose";

const stockUsageSchema = new mongoose.Schema(
  {
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },

    category: {
      type: String,
      trim: true,
    },

    quantityUsed: {
      type: Number,
      required: true,
      min: 0,
    },

    unit: {
      type: String,
      required: true,
      trim: true,
    },

    usageType: {
      type: String,
      required: true,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
    },

    usedDate: {
      type: Date,
      default: Date.now,
    },
    department: {
      type: String,
      trim: true,
    },

    reference: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

const StockUsage = mongoose.model("StockUsage", stockUsageSchema);

export default StockUsage;
