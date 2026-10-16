import mongoose from "mongoose";

const billItemSchema = new mongoose.Schema(
  {
    foodItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodItem",
      default: null,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    kitchenStation: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { _id: false },
);

const billSchema = new mongoose.Schema(
  {
    billNo: { type: String, required: true },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    billType: {
      type: String,
      enum: ["dine-in", "takeaway", "room-charge", "delivery"],
      default: "dine-in",
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
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    guestName: { type: String, default: "" },
    guestPhone: { type: String, default: "" },
    guestEmail: { type: String, default: "" },
    linkedOrderIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Order",
      default: [],
    },
    items: { type: [billItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    discountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Discount",
      default: null,
    },
    couponCode: { type: String, default: "" },
    discountAmount: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    serviceCharges: { type: [{ name: String, amount: Number }], default: [] },
    totalAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft", "saved", "paid", "cancelled"],
      default: "draft",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid",
    },
    cashierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

billSchema.index({ hotelId: 1, billNo: 1 }, { unique: true });

export default mongoose.model("Bill", billSchema);
