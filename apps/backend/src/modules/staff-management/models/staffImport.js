import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const staffImportSchema = new Schema(
  {
    hotelId: { type: Schema.Types.ObjectId, required: true, index: true },
    originalName: { type: String, default: "" },
    fileKey: { type: String, required: true },
    storage: { type: String, enum: ["r2", "local"], required: true },
    status: {
      type: String,
      enum: ["QUEUED", "PROCESSING", "COMPLETED", "FAILED"],
      default: "QUEUED",
    },
    totalRows: { type: Number, default: 0 },
    createdCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    reportKey: { type: String, default: "" },
    errorMessage: { type: String, default: "" },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const StaffImport =
  models.StaffImport || model("StaffImport", staffImportSchema);
