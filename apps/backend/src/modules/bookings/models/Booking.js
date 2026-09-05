import mongoose from "mongoose";

import { GUEST_STATUSES } from "#/shared/constants/guest.js";

const bookingSchema = new mongoose.Schema(
  {
    guestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

export default mongoose.model("Booking", bookingSchema);
