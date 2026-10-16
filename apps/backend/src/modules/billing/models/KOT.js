import mongoose from "mongoose";

const kotItemSchema = new mongoose.Schema(
  {
    name: String,
    quantity: Number,
    notes: String,
    status: { type: String, default: "preparing" },
  },
  { _id: false },
);
const timelineSchema = new mongoose.Schema(
  { event: String, timestamp: { type: Date, default: Date.now } },
  { _id: false },
);

const kotSchema = new mongoose.Schema(
  {
    kotNo: { type: String, required: true },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
      default: null,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      default: null,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      default: null,
    },
    station: { type: String, default: "Main Kitchen" },
    items: { type: [kotItemSchema], default: [] },
    status: {
      type: String,
      enum: ["preparing", "ready", "served", "cancelled"],
      default: "preparing",
    },
    timeline: {
      type: [timelineSchema],
      default: [{ event: "Order received" }],
    },
  },
  { timestamps: true },
);

kotSchema.index({ hotelId: 1, kotNo: 1 }, { unique: true });

export default mongoose.model("KOT", kotSchema);
