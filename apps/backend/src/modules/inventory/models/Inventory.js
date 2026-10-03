import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    currentStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    unit: {
      type: String,
      required: true,
      trim: true,
    },

    minimumStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    costPerUnit: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    expiryDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

const Inventory = mongoose.model("InventoryItem", inventorySchema);

export default Inventory;
