import mongoose from "mongoose";

export const FACE_AUDIT_ACTIONS = [
  "ENROLL",
  "UPDATE",
  "DELETE",
  "VIEW_IMAGE",
  "SUSPEND",
  "RESTORE",
  "PURGE",
];

const faceAuditSchema = new mongoose.Schema(
  {
    hotelId: { type: mongoose.Schema.Types.ObjectId, required: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, required: true },
    action: { type: String, enum: FACE_AUDIT_ACTIONS, required: true },
    actor: {
      userId: { type: mongoose.Schema.Types.ObjectId, default: null },
      name: { type: String, default: "" },
    },
    note: { type: String, default: "" },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "staff_face_audit",
  },
);

faceAuditSchema.index({ hotelId: 1, staffId: 1, createdAt: -1 });

export const FaceAudit =
  mongoose.models.StaffFaceAudit ||
  mongoose.model("StaffFaceAudit", faceAuditSchema);
