import fs from "node:fs";
import mongoose from "mongoose";
import { ReportJob } from "../models/reportJob.js";
import { StaffDepartment } from "../../staff-management/models/staffManagement.js";
import {
  countReport,
  fail,
  fetchReport,
  normalizeType,
  reportTitle,
} from "./reportQuery.service.js";
import {
  absolutePath,
  FORMATS,
  writeReportFile,
} from "./reportFile.service.js";

const RETENTION_DAYS = 30;
const PREVIEW_DEFAULT = 10;
const PREVIEW_MAX = 1000;

const DATE_TYPES = ["ATTENDANCE", "LEAVE", "SHIFT"];
const TYPE_LABEL = {
  ATTENDANCE: "Attendance",
  LEAVE: "Leave",
  SHIFT: "Shift",
  STAFF: "Staff",
  DEVICE: "Device",
};
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

async function buildReportName(type, f = {}) {
  if (type === "DEVICE") return "Device Activity Report";

  if (type === "STAFF") {
    let dept = "All Departments";
    const id = String(f.departmentId ?? "").trim();
    if (mongoose.isValidObjectId(id)) {
      const d = await StaffDepartment.findById(id).select("name").lean();
      if (d?.name) dept = d.name;
    }
    return `Staff List - ${dept}`;
  }

  const label = TYPE_LABEL[type];
  const { from, to } = f;
  if (from && to && from.slice(0, 7) === to.slice(0, 7)) {
    const [y, m] = from.split("-");
    return `${MONTHS[Number(m) - 1]} ${y} - ${label}`;
  }
  return `${label} Report ${from} to ${to}`;
}

const toDto = (job) => {
  const f = job.params?.filters ?? {};
  return {
    id: job._id,
    name: job.reportName || reportTitle(job.type),
    fileName: job.fileName || "",
    type: job.type,
    format: job.format,
    dateRange:
      DATE_TYPES.includes(job.type) && f.from && f.to
        ? { from: f.from, to: f.to }
        : null,
    records: job.records,
    status: job.status,
    errorMessage: job.errorMessage || "",
    generatedBy: job.createdByName || "",
    generatedOn: job.createdAt,
    expiresAt: job.expiresAt,
    expired: job.expiresAt < new Date(),
  };
};

export async function preview(hotelId, body = {}) {
  const type = normalizeType(body.type);
  const limit = Math.min(
    Math.max(parseInt(body.limit, 10) || PREVIEW_DEFAULT, 1),
    PREVIEW_MAX,
  );
  const { columns, rows, total } = await fetchReport(
    hotelId,
    type,
    body.filters,
    { limit },
  );
  return { type, columns, rows, total };
}

async function runJob(jobId) {
  const job = await ReportJob.findOneAndUpdate(
    { _id: jobId, status: "QUEUED" },
    { status: "PROCESSING" },
    { new: true },
  );
  if (!job) return;

  try {
    const { filters } = job.params;
    const { columns, rows } = await fetchReport(job.hotelId, job.type, filters);

    const ext = FORMATS[job.format].ext;
    const range =
      filters?.from && filters?.to ? `${filters.from}_to_${filters.to}` : "";
    const stamp = new Date().toISOString().slice(0, 10);
    const fileName = `${job.type.toLowerCase()}-report-${range || stamp}.${ext}`;
    const fileKey = `${job.hotelId}/${job._id}.${ext}`;

    await writeReportFile(job.format, {
      fileKey,
      title: reportTitle(job.type),
      subtitle: `${range ? range.replace("_to_", " to ") + " | " : ""}${rows.length} records | Generated ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`,
      columns,
      rows,
    });

    job.set({
      status: "COMPLETED",
      fileKey,
      fileName,
      records: rows.length,
      finishedAt: new Date(),
    });
  } catch (err) {
    console.error("[reports] export failed:", err);
    job.set({
      status: "FAILED",
      errorMessage: String(err.message || "Export failed").slice(0, 300),
      finishedAt: new Date(),
    });
  }
  await job.save();
}

export async function createExportJob(hotelId, body = {}, actor = {}) {
  const type = normalizeType(body.type);
  const format = String(body.format ?? "").toUpperCase();
  if (!FORMATS[format])
    throw fail(
      400,
      `Invalid format. Allowed: ${Object.keys(FORMATS).join(", ")}`,
    );

  const filters = body.filters ?? {};
  const total = await countReport(hotelId, type, filters);
  if (!total) throw fail(400, "No records found for the selected filters.");

  const job = await ReportJob.create({
    hotelId,
    type,
    format,
    reportName: await buildReportName(type, filters),
    params: { filters, options: body.options ?? {} },
    records: total,
    createdBy: actor.userId ?? null,
    createdByName: actor.name ?? "",
    expiresAt: new Date(Date.now() + RETENTION_DAYS * 86400000),
  });

  setImmediate(() => runJob(job._id).catch(() => {}));

  return toDto(job);
}

export async function failStaleJobs() {
  await ReportJob.updateMany(
    {
      status: { $in: ["QUEUED", "PROCESSING"] },
      createdAt: { $lt: new Date(Date.now() - 15 * 60 * 1000) },
    },
    { status: "FAILED", errorMessage: "Interrupted by server restart." },
  );
}

export async function listJobs(hotelId, query = {}) {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);
  const page = Math.max(parseInt(query.page, 10) || 1, 1);

  const [jobs, total] = await Promise.all([
    ReportJob.find({ hotelId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ReportJob.countDocuments({ hotelId }),
  ]);

  return {
    rows: jobs.map(toDto),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function getDownload(hotelId, id) {
  if (!mongoose.isValidObjectId(id)) throw fail(400, "Invalid report id.");

  const job = await ReportJob.findOne({ _id: id, hotelId }).lean();
  if (!job) throw fail(404, "Report not found.");
  if (job.status !== "COMPLETED") throw fail(409, "Report is not ready yet.");
  if (job.expiresAt < new Date())
    throw fail(410, "This report has expired. Please generate it again.");

  const filePath = absolutePath(job.fileKey);
  if (!fs.existsSync(filePath))
    throw fail(410, "Report file is no longer available.");

  return { filePath, fileName: job.fileName };
}
