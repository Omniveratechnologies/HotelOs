import mongoose from "mongoose";

import {
  RESERVATION_STATUSES,
  RESERVATION_SOURCES,
  OTA_CHANNELS,
  PAYMENT_STATUSES,
} from "../constants.js";

const addOnSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    quantity: { type: Number, default: 1, min: 1 },
  },
  { _id: false },
);

const pricingSnapshotSchema = new mongoose.Schema(
  {
    // Snapshot taken at booking time — later rate changes must not alter it.
    nightlyRate: { type: Number, default: 0, min: 0 },
    rateSource: {
      type: String,
      enum: ["ratePlan", "room", "override"],
      default: "room",
    },
    roomCharge: { type: Number, default: 0 },
    addOns: { type: [addOnSchema], default: [] },
    addOnsTotal: { type: Number, default: 0 },
    discount: {
      type: { type: String, enum: ["percent", "flat"], default: null },
      value: { type: Number, default: 0 },
      amount: { type: Number, default: 0 },
    },
    taxableBase: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 12 },
    taxAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    currency: { type: String, default: "INR", trim: true },
  },
  { _id: false },
);

const otaInfoSchema = new mongoose.Schema(
  {
    channel: { type: String, enum: OTA_CHANNELS, default: null },
    otaBookingId: { type: String, trim: true, default: null },
    confirmationCode: { type: String, trim: true, default: null },
    otaRatePlanName: { type: String, trim: true, default: null },
    otaRoomName: { type: String, trim: true, default: null },
    commissionPercent: { type: Number, default: 0 },
    commissionAmount: { type: Number, default: 0 },
    netAmount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["prepaid-by-ota", "pay-at-hotel"],
      default: null,
    },
    cancellationPolicy: {
      freeUntil: { type: Date, default: null },
      penalty: { type: String, default: null },
    },
  },
  { _id: false },
);

const auditEntrySchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    action: { type: String, required: true, trim: true },
    from: { type: String, default: null },
    to: { type: String, default: null },
    note: { type: String, default: null, trim: true },
  },
  { _id: false },
);

const bookingSchema = new mongoose.Schema(
  {
    reservationNo: {
      type: String,
      trim: true,
      default: null,
    },

    source: {
      type: String,
      enum: RESERVATION_SOURCES,
      default: "DIRECT",
    },

    guestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Optional — OTA bookings may arrive without any guest data (OTAs do
      // not always share it). Only direct-stay bookings always have a user.
      default: null,
    },

    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },

    // Assigned physical room; stays null until auto-assign / manual assign.
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      default: null,
    },

    // Requested room type (Aiosell roomCode) — set for every new booking.
    roomTypeCode: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },

    ratePlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RatePlan",
      default: null,
    },

    mealPlan: {
      type: String,
      enum: ["EP", "AP", "MAP", "CP", "BP", null],
      default: null,
    },

    checkIn: {
      type: Date,
    },

    checkOut: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: RESERVATION_STATUSES,
      default: "confirmed",
    },

    rooms: { type: Number, default: 1, min: 1 },
    adults: { type: Number, default: 1, min: 0 },
    children: { type: Number, default: 0, min: 0 },
    infants: { type: Number, default: 0, min: 0 },

    guestType: {
      type: String,
      trim: true,
      default: "individual",
    },

    purpose: {
      type: String,
      default: null,
      trim: true,
    },

    specialRequests: {
      type: String,
      default: null,
      trim: true,
    },

    dndEnabled: {
      type: Boolean,
      default: false,
    },

    pricing: {
      type: pricingSnapshotSchema,
      default: () => ({}),
    },

    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "unpaid",
    },

    // Set when the receptionist approves the guest's digital check-in.
    checkInVerified: {
      type: Boolean,
      default: false,
    },

    otaInfo: {
      type: otaInfoSchema,
      default: null,
    },

    cancellation: {
      type: new mongoose.Schema(
        {
          reason: { type: String, trim: true, default: null },
          at: { type: Date, default: null },
          by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
          },
          charge: { type: Number, default: 0 },
        },
        { _id: false },
      ),
      default: null,
    },

    auditTrail: {
      type: [auditEntrySchema],
      default: [],
    },

    // ---- Channel manager / OTA legacy metadata (kept for Aiosell flows) ----

    // Booking source label — "DIRECT" for direct stays, OTA name otherwise.
    channel: {
      type: String,
      default: "DIRECT",
      trim: true,
    },

    // Aiosell's booking identifier, used to match modify/cancel webhooks.
    aiosellBookingId: {
      type: String,
      default: null,
      trim: true,
    },

    // When the OTA created the booking.
    bookedOn: {
      type: Date,
      default: null,
    },

    totalAmountBeforeTax: {
      type: Number,
      default: 0,
    },

    tax: {
      type: Number,
      default: 0,
    },

    commission: {
      type: Number,
      default: 0,
    },

    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
  },
  {
    timestamps: true,

    toJSON: { virtuals: true },

    toObject: { virtuals: true },
  },
);

// Number of nights between check-in and check-out
bookingSchema.virtual("nights").get(function () {
  if (!this.checkIn || !this.checkOut) {
    return null;
  }

  const nights = Math.round(
    (this.checkOut - this.checkIn) / (1000 * 60 * 60 * 24),
  );

  return Math.max(1, nights);
});

bookingSchema.index({ hotelId: 1, status: 1 });
bookingSchema.index({ guestId: 1, status: 1 });
bookingSchema.index({ roomId: 1, status: 1 });
bookingSchema.index(
  { hotelId: 1, reservationNo: 1 },
  {
    unique: true,
    partialFilterExpression: { reservationNo: { $type: "string" } },
  },
);
bookingSchema.index(
  { hotelId: 1, aiosellBookingId: 1 },
  {
    unique: true,
    partialFilterExpression: { aiosellBookingId: { $type: "string" } },
  },
);

export default mongoose.model("Booking", bookingSchema);
