import mongoose from "mongoose";

const stockAdjustmentSchema = new mongoose.Schema(
  {
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    previousStock: {
      type: Number,
      required: true,
      min: 0,
    },
    physicalStock: {
      type: Number,
      required: true,
      min: 0,
    },
    difference: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    adjustmentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

const StockAdjustment = mongoose.model(
  "StockAdjustment",
  stockAdjustmentSchema,
);

export default StockAdjustment;
