import mongoose from "mongoose";

export const GUEST_ID_TYPES = [
  "Aadhaar",
  "PAN",
  "Passport",
  "Driving License",
  "Voter ID",
  "Other",
];

export const GUEST_STATUSES = ["reserved", "checked-in", "checked-out"];

const guestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    idType: {
      type: String,
      enum: GUEST_ID_TYPES,
      default: "Aadhaar",
    },

    idNumber: {
      type: String,
      default: "",
      trim: true,
    },

    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },

    // Login account (role GUEST) auto-generated at registration
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    checkIn: {
      type: Date,
    },

    checkOut: {
      type: Date,
    },

    status: {
      type: String,
      enum: GUEST_STATUSES,
      default: "checked-in",
    },

    documents: [
      {
        docType: {
          type: String,
          enum: GUEST_ID_TYPES,
          required: true,
        },
        filename: {
          type: String,
          required: true,
        },
        path: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,

    toJSON: { virtuals: true },

    toObject: { virtuals: true },
  },
);

// Number of nights between check-in and check-out
guestSchema.virtual("nights").get(function () {
  if (!this.checkIn || !this.checkOut) {
    return null;
  }

  const nights = Math.round(
    (this.checkOut - this.checkIn) / (1000 * 60 * 60 * 24),
  );

  return Math.max(1, nights);
});

export default mongoose.model("Guest", guestSchema);
