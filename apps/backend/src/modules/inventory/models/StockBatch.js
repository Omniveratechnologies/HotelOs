import mongoose from "mongoose";

const stockBatchSchema = new mongoose.Schema(
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

    supplierName: {
      type: String,
      required: true,
      trim: true,
    },

    batchNumber: {
      type: String,
      trim: true,
    },

    manufacturingDate: {
      type: Date,
    },

    expiryDate: {
      type: Date,
    },

    quantityReceived: {
      type: Number,
      required: true,
      min: 0,
    },

    unit: {
      type: String,
      required: true,
      trim: true,
    },

    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },

    totalCost: {
      type: Number,
      min: 0,
    },

    notes: {
      type: String,
      trim: true,
    },

    receivedDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

const StockBatch = mongoose.model("StockBatch", stockBatchSchema);

export default StockBatch;
