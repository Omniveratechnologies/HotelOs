import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

export const REPORT_TYPES = ["ATTENDANCE", "STAFF", "LEAVE", "SHIFT", "DEVICE"];
export const REPORT_FORMATS = ["XLSX", "PDF", "CSV"];
export const REPORT_JOB_STATUSES = [
  "QUEUED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
];

const reportJobSchema = new Schema(
  {
    hotelId: { type: Schema.Types.ObjectId, required: true, index: true },

    type: { type: String, enum: REPORT_TYPES, required: true },
    format: { type: String, enum: REPORT_FORMATS, required: true },

    params: { type: Schema.Types.Mixed, default: {} },

    status: { type: String, enum: REPORT_JOB_STATUSES, default: "QUEUED" },
    records: { type: Number, default: 0 },

    fileKey: { type: String, default: "" },
    reportName: { type: String, default: "" },
    fileName: { type: String, default: "" },
    errorMessage: { type: String, default: "" },

    createdBy: { type: Schema.Types.ObjectId, default: null },
    createdByName: { type: String, default: "" },

    finishedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

reportJobSchema.index({ hotelId: 1, createdAt: -1 });
reportJobSchema.index({ status: 1, createdAt: 1 });

export const ReportJob =
  models.ReportJob || model("ReportJob", reportJobSchema);
