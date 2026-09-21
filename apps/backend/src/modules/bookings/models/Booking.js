import mongoose from "mongoose";

import { GUEST_STATUSES } from "#/shared/constants/guest.js";

const bookingSchema = new mongoose.Schema(
  {
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

    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
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
      enum: GUEST_STATUSES,
      default: "checked-in",
    },

    dndEnabled: {
      type: Boolean,
      default: false,
    },

    // ---- Channel manager / OTA metadata ----

    // Booking source — "DIRECT" for walk-ins/registerStay, OTA name otherwise.
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

    specialRequests: {
      type: String,
      default: null,
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
  { hotelId: 1, aiosellBookingId: 1 },
  {
    unique: true,
    partialFilterExpression: { aiosellBookingId: { $type: "string" } },
  },
);

export default mongoose.model("Booking", bookingSchema);
