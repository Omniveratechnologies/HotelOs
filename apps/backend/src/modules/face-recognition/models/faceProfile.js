import mongoose from "mongoose";

const consentSchema = new mongoose.Schema(
  {
    given: { type: Boolean, default: false },
    givenAt: { type: Date, default: null },
    noticeVersion: { type: String, default: "v1" },
    recordedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, default: null },
      name: { type: String, default: "" },
    },
  },
  { _id: false },
);

export const FACE_PROFILE_STATUSES = ["REGISTERED", "SUSPENDED", "REMOVED"];

const faceProfileSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    // REGISTERED = recognised by kiosks. SUSPENDED = staff left, kept only until the retention period ends.
    // REMOVED = all biometric data deleted (row kept so kiosks learn about the removal).
    status: {
      type: String,
      enum: FACE_PROFILE_STATUSES,
      default: "REGISTERED",
    },
    version: { type: Number, default: 0 }, // +1 on every enrol / remove
    batchId: { type: mongoose.Schema.Types.ObjectId, default: null }, // the samples that are current
    sampleCount: { type: Number, default: 0 },
    avgQuality: { type: Number, default: 0 },
    engine: {
      mode: { type: String, default: "" },
      model: { type: String, default: "" },
    },
    consent: { type: consentSchema, default: () => ({}) },
    registeredAt: { type: Date, default: null }, // first enrolment ("Today's Registrations")
    lastEnrolledAt: { type: Date, default: null },
    lastEnrolledBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, default: null },
      name: { type: String, default: "" },
    },
    syncedAt: { type: Date, default: Date.now }, // kiosks pull everything with syncedAt after their last cursor
    suspendedAt: { type: Date, default: null },
    removedAt: { type: Date, default: null },
    removedReason: { type: String, default: "" },
  },
  { timestamps: true, collection: "staff_face_profiles" },
);

faceProfileSchema.index({ hotelId: 1, staffId: 1 }, { unique: true });
faceProfileSchema.index({ hotelId: 1, status: 1, syncedAt: 1, _id: 1 });

export const FaceProfile =
  mongoose.models.StaffFaceProfile ||
  mongoose.model("StaffFaceProfile", faceProfileSchema);
