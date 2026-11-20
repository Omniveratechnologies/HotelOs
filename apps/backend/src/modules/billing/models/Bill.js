import mongoose from "mongoose";
import { encrypt, decrypt } from "#/shared/services/encryption.service.js";

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
    // Encrypted sensitive guest fields
    guestNameEncrypted: { type: String, default: "", select: false },
    guestPhoneEncrypted: { type: String, default: "", select: false },
    guestEmailEncrypted: { type: String, default: "", select: false },
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

// Virtual getters/setters for encrypted fields
billSchema
  .virtual("guestName")
  .get(function () {
    if (!this.guestNameEncrypted) return "";
    try {
      return decrypt(this.guestNameEncrypted);
    } catch {
      return this.guestNameEncrypted;
    }
  })
  .set(function (value) {
    this.guestNameEncrypted = value ? encrypt(String(value)) : "";
  });

billSchema
  .virtual("guestPhone")
  .get(function () {
    if (!this.guestPhoneEncrypted) return "";
    try {
      return decrypt(this.guestPhoneEncrypted);
    } catch {
      return this.guestPhoneEncrypted;
    }
  })
  .set(function (value) {
    this.guestPhoneEncrypted = value ? encrypt(String(value)) : "";
  });

billSchema
  .virtual("guestEmail")
  .get(function () {
    if (!this.guestEmailEncrypted) return "";
    try {
      return decrypt(this.guestEmailEncrypted);
    } catch {
      return this.guestEmailEncrypted;
    }
  })
  .set(function (value) {
    this.guestEmailEncrypted = value ? encrypt(String(value)) : "";
  });

// Ensure virtuals are included in JSON
billSchema.set("toJSON", { virtuals: true });
billSchema.set("toObject", { virtuals: true });

billSchema.index({ hotelId: 1, billNo: 1 }, { unique: true });

export default mongoose.model("Bill", billSchema);
