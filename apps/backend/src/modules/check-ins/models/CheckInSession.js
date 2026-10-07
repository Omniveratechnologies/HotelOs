import mongoose from "mongoose";

/** Check-in session states (guest self check-in + receptionist review). */
export const CHECKIN_STATUSES = [
  "link-sent",
  "in-progress",
  "submitted",
  "correction-requested",
  "approved",
  "rejected",
  "expired",
];

/** Self-check-in step keys in display order (1-based for guests). */
export const CHECKIN_STEPS = [
  "welcome",
  "booking",
  "guest",
  "id",
  "photo",
  "registration-card",
  "signature",
  "preferences",
  "review",
  "success",
];

const fileRefSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    filename: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const stepDataSchema = new mongoose.Schema(
  {
    guestName: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    nationality: { type: String, trim: true, default: "" },
    dateOfBirth: { type: String, trim: true, default: "" },
    idType: { type: String, trim: true, default: "" },
    idNumber: { type: String, trim: true, default: "" },
    idFront: { type: fileRefSchema, default: null },
    idBack: { type: fileRefSchema, default: null },
    selfie: { type: fileRefSchema, default: null },
    signature: { type: fileRefSchema, default: null },
    termsAcceptedAt: { type: Date, default: null },
    preferences: { type: [String], default: [] },
    remarks: { type: String, trim: true, default: "" },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { _id: false },
);

const reviewSchema = new mongoose.Schema(
  {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
    decision: {
      type: String,
      enum: ["approved", "rejected", "correction-requested", null],
      default: null,
    },
    message: { type: String, trim: true, default: null },
    // Step keys the guest must revisit when a correction is requested.
    steps: { type: [String], default: [] },
  },
  { _id: false },
);

const checkInSessionSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },

    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    // sha256 hex of the guest link token (token itself is never stored).
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: CHECKIN_STATUSES,
      default: "link-sent",
    },

    sentVia: {
      type: String,
      enum: ["EMAIL"],
      default: "EMAIL",
    },

    sentAt: { type: Date, default: null },

    currentStep: { type: Number, default: 1, min: 1 },

    stepData: {
      type: stepDataSchema,
      default: () => ({}),
    },

    submittedAt: { type: Date, default: null },

    review: {
      type: reviewSchema,
      default: () => ({}),
    },

    auditTrail: {
      type: [
        new mongoose.Schema(
          {
            at: { type: Date, default: Date.now },
            by: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
              default: null,
            },
            action: { type: String, required: true, trim: true },
            note: { type: String, trim: true, default: null },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { timestamps: true },
);

checkInSessionSchema.index({ hotelId: 1, status: 1 });
checkInSessionSchema.index({ reservationId: 1 });

export default mongoose.model("CheckInSession", checkInSessionSchema);
