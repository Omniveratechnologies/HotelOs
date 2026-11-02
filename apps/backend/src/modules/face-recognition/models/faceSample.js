import mongoose from "mongoose";

export const FACE_ANGLES = ["FRONT", "LEFT", "RIGHT", "UP", "DOWN"];
export const EMBEDDING_DIM = 512; // InsightFace / ArcFace

const faceSampleSchema = new mongoose.Schema(
  {
    hotelId: { type: mongoose.Schema.Types.ObjectId, required: true },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    batchId: { type: mongoose.Schema.Types.ObjectId, required: true }, // one enrolment = one batch
    angle: { type: String, enum: FACE_ANGLES, default: "FRONT" },
    embedding: {
      type: [Number],
      select: false, // never sent to the browser by accident
      validate: {
        validator: (v) => Array.isArray(v) && v.length === EMBEDDING_DIM,
        message: `Embedding must have ${EMBEDDING_DIM} numbers.`,
      },
    },
    qualityScore: { type: Number, min: 0, max: 1, default: 0 },
    livenessScore: { type: Number, min: 0, max: 1, default: null },
    pose: {
      yaw: { type: Number, default: 0 },
      pitch: { type: Number, default: 0 },
      roll: { type: Number, default: 0 },
    },
    imageKey: { type: String, default: "" }, // private, encrypted object
    mimeType: { type: String, default: "image/jpeg" },
    sizeBytes: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "staff_face_samples",
  },
);

faceSampleSchema.index({ hotelId: 1, staffId: 1, batchId: 1 });

export const FaceSample =
  mongoose.models.StaffFaceSample ||
  mongoose.model("StaffFaceSample", faceSampleSchema);
