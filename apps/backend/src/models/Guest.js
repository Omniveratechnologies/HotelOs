import mongoose from "mongoose";

import { generateDownloadUrl } from "../config/r2.js";

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

// The document's stored "path" is the Cloudflare R2 object key; expose it
// through a short-lived presigned download URL.
const documentDTO = async (doc) => {
  const key = String(doc.path || "");

  return {
    id: doc._id,
    docType: doc.docType,
    filename: doc.filename,
    url: key ? await generateDownloadUrl(key) : null,
    uploadedAt: doc.uploadedAt,
  };
};

const guestResponseDTO = async (guest, extra = {}) => ({
  id: guest._id,
  name: guest.name,
  email: guest.email,
  phone: guest.phone,
  address: guest.address,
  idType: guest.idType,
  idNumber: guest.idNumber,
  roomId: guest.roomId,
  room: guest.room
    ? {
        id: guest.room._id,
        roomNumber: guest.room.roomNumber,
        type: guest.room.type,
        rate: guest.room.rate,
        floor: guest.room.floor,
      }
    : null,
  hotelId: guest.hotelId,
  userId: guest.userId,
  checkIn: guest.checkIn,
  checkOut: guest.checkOut,
  status: guest.status,
  nights: guest.nights ?? null,
  documents: await Promise.all((guest.documents || []).map(documentDTO)),
  createdAt: guest.createdAt,
  ...extra,
});

export default mongoose.model("Guest", guestSchema);

export { guestResponseDTO };
