import mongoose from "mongoose";

const wastageSchema = new mongoose.Schema(
  {
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    itemName: { type: String, required: true, trim: true },
    batchNumber: { type: String, trim: true },

    quantity: { type: Number, required: true, min: 0.01 },
    unit: { type: String, required: true, trim: true },

    reason: {
      type: String,
      enum: [
        "EXPIRED",
        "SPOILED",
        "DAMAGED",
        "OVERPRODUCTION",
        "BURNT",
        "DROPPED",
        "UNKNOWN",
      ],
      required: true,
    },

    department: { type: String, required: true, trim: true },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true, maxlength: 200 },

    // snapshot at time of wastage, so historic cost never drifts if the
    // item's price changes later
    costPerUnit: { type: Number, default: 0, min: 0 },
    totalCost: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

wastageSchema.index({ date: -1 });
wastageSchema.index({ reason: 1 });
wastageSchema.index({ department: 1 });

const Wastage = mongoose.model("Wastage", wastageSchema);

export default Wastage;
