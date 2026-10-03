import mongoose from "mongoose";

const purchaseHistorySchema = new mongoose.Schema(
  {
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },

    stockBatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockBatch",
      required: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    supplierName: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
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
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },

    purchaseDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

const PurchaseHistory = mongoose.model(
  "PurchaseHistory",
  purchaseHistorySchema,
);

export default PurchaseHistory;
