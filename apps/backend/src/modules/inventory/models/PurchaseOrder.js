import mongoose from "mongoose";

const purchaseOrderItemSchema = new mongoose.Schema(
  {
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },

    itemName: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },

    quantity: { type: Number, required: true, min: 0.01 },

    receivedQuantity: { type: Number, default: 0, min: 0 },

    unit: { type: String, required: true, trim: true },
    unitCost: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    note: { type: String, trim: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const receiptSchema = new mongoose.Schema({
  receivedAt: { type: Date, default: Date.now },
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  lines: [
    {
      inventoryItem: { type: mongoose.Schema.Types.ObjectId },
      itemName: String,
      quantity: Number,
      batchNumber: String,
      stockBatch: { type: mongoose.Schema.Types.ObjectId, ref: "StockBatch" },
    },
  ],
});

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, unique: true, trim: true },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },

    supplierName: { type: String, required: true, trim: true },

    orderDate: { type: Date, default: Date.now },
    expectedDeliveryDate: { type: Date },

    items: {
      type: [purchaseOrderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "At least one item is required",
      },
    },

    subtotal: { type: Number, required: true, min: 0 },
    taxPercentage: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: [
        "DRAFT",
        "SENT",
        "CONFIRMED",
        "PARTIALLY_RECEIVED",
        "RECEIVED",
        "CANCELLED",
      ],
      default: "DRAFT",
    },

    notes: { type: String, trim: true },

    statusHistory: { type: [statusHistorySchema], default: [] },
    receipts: { type: [receiptSchema], default: [] },
  },
  { timestamps: true },
);

const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);

export default PurchaseOrder;
