import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { parse } from "csv-parse/sync";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import {
  Staff,
  StaffDepartment,
  StaffDesignation,
} from "../models/staffManagement.js";
import { StaffImport } from "../models/staffImport.js";

export const MAX_IMPORT_ROWS = 5000;
const CHUNK_SIZE = 500;

export const TEMPLATE_HEADERS = [
  "name",
  "phone",
  "email",
  "department",
  "designation",
  "joinedOn",
  "status",
  "employmentType",
  "dob",
  "address",
];
const REQUIRED_HEADERS = ["name", "phone", "department", "designation"];

const csvCell = (value) => {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (/^([=@\t\r]|[+-](?!\d))/.test(text)) text = `'${text}`;
  if (/[",\n\r]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
};

export const csvLine = (values) => `${values.map(csvCell).join(",")}\r\n`;

const r2Config = () => {
  const {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME,
  } = process.env;
  if (
    !R2_ACCOUNT_ID ||
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !R2_BUCKET_NAME
  )
    return null;
  return {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME,
  };
};

let client;
const s3 = (config) => {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.R2_ACCESS_KEY_ID,
        secretAccessKey: config.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
};

const LOCAL_DIR = path.resolve(process.cwd(), "uploads");

const saveFile = async (key, buffer, contentType) => {
  const config = r2Config();

  if (config) {
    await s3(config).send(
      new PutObjectCommand({
        Bucket: config.R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    return "r2";
  }

  const target = path.join(LOCAL_DIR, key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, buffer);
  return "local";
};

export const readStoredFile = async (storage, key) => {
  if (storage === "r2") {
    const config = r2Config();
    if (!config)
      throw new Error("R2 is not configured, cannot read the stored file.");
    const result = await s3(config).send(
      new GetObjectCommand({ Bucket: config.R2_BUCKET_NAME, Key: key }),
    );
    return Buffer.from(await result.Body.transformToByteArray());
  }
  return fs.readFile(path.join(LOCAL_DIR, key));
};

const HEADER_ALIASES = {
  name: "name",
  fullname: "name",
  staffname: "name",
  phone: "phone",
  mobile: "phone",
  mobilenumber: "phone",
  phonenumber: "phone",
  email: "email",
  emailaddress: "email",
  department: "department",
  departmentname: "department",
  dept: "department",
  designation: "designation",
  designationname: "designation",
  joinedon: "joinedOn",
  joindate: "joinedOn",
  joiningdate: "joinedOn",
  dateofjoining: "joinedOn",
  status: "status",
  employmenttype: "employmentType",
  employment: "employmentType",
  dob: "dob",
  dateofbirth: "dob",
  address: "address",
};

const normalizeHeader = (raw) =>
  HEADER_ALIASES[
    String(raw ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
  ] || "";

export const parseCsv = (text) => {
  const records = parse(text, {
    bom: true,
    trim: true,
    skip_empty_lines: true,
    relax_column_count: true,
    info: true,
  });

  if (records.length === 0) throw new Error("The file is empty.");

  const headers = records[0].record.map(normalizeHeader);
  const missing = REQUIRED_HEADERS.filter(
    (header) => !headers.includes(header),
  );
  if (missing.length > 0)
    throw new Error(`Missing required column(s): ${missing.join(", ")}.`);

  const rows = [];

  records.slice(1).forEach(({ record, info }) => {
    const data = {};
    let hasValue = false;

    headers.forEach((key, index) => {
      if (!key) return;
      const value = String(record[index] ?? "").trim();
      if (value) hasValue = true;
      data[key] = value;
    });

    if (hasValue) rows.push({ rowNumber: info.lines, data });
  });

  return rows;
};

const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"];

export const normalizePhone = (value) => {
  let digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
};

export const parseDate = (text) => {
  const value = String(text ?? "").trim();
  let year;
  let month;
  let day;
  let match;

  if ((match = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) {
    [, year, month, day] = match;
  } else if ((match = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/))) {
    [, day, month, year] = match;
  } else {
    return null;
  }

  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  const valid =
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day);

  return valid ? date : null;
};

const ageOn = (dob, today = new Date()) => {
  let age = today.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < dob.getUTCMonth() ||
    (today.getUTCMonth() === dob.getUTCMonth() &&
      today.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
};

export const validateRow = (data, context) => {
  const messages = [];

  const name = data.name?.trim() ?? "";
  if (name.length < 2) messages.push("name is required (min 2 characters)");

  const phone = normalizePhone(data.phone);
  if (!data.phone) messages.push("phone is required");
  else if (phone.length < 7 || phone.length > 15)
    messages.push(`invalid phone "${data.phone}"`);
  else if (context.takenPhones.has(phone))
    messages.push(`duplicate phone ${phone}`);

  const email = data.email?.trim().toLowerCase() ?? "";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    messages.push(`invalid email "${data.email}"`);

  const departmentName = data.department?.trim() ?? "";
  const department = context.departments.get(departmentName.toLowerCase());
  if (!departmentName) messages.push("department is required");
  else if (!department) messages.push(`unknown department "${departmentName}"`);

  const designationName = data.designation?.trim() ?? "";
  const designation = department
    ? context.designations.get(
        `${department._id}:${designationName.toLowerCase()}`,
      )
    : null;
  if (!designationName) messages.push("designation is required");
  else if (department && !designation) {
    messages.push(
      `unknown designation "${designationName}" for department "${department.name}"`,
    );
  }

  let joinedOn = new Date();
  if (data.joinedOn) {
    joinedOn = parseDate(data.joinedOn);
    if (!joinedOn)
      messages.push(
        `invalid joinedOn "${data.joinedOn}" (use YYYY-MM-DD or DD/MM/YYYY)`,
      );
  }

  let dob = null;
  if (data.dob) {
    dob = parseDate(data.dob);
    if (!dob)
      messages.push(`invalid dob "${data.dob}" (use YYYY-MM-DD or DD/MM/YYYY)`);
    else if (ageOn(dob) < 18)
      messages.push("staff must be at least 18 years old");
  }

  const status = (data.status || "ACTIVE").toUpperCase();
  if (!["ACTIVE", "INACTIVE"].includes(status))
    messages.push(`invalid status "${data.status}" (ACTIVE or INACTIVE)`);

  const employmentType = (data.employmentType || "FULL_TIME")
    .toUpperCase()
    .replace(/[^A-Z]+/g, "_");
  if (!EMPLOYMENT_TYPES.includes(employmentType)) {
    messages.push(
      `invalid employmentType "${data.employmentType}" (FULL_TIME, PART_TIME, CONTRACT, INTERN)`,
    );
  }

  return {
    messages,
    value: {
      name,
      phone,
      email,
      dob,
      address: data.address?.trim() ?? "",
      departmentId: department?._id,
      designationId: designation?._id,
      joinedOn,
      status,
      employmentType,
    },
  };
};

export const createImportJob = async ({ hotelId, originalName, buffer }) => {
  const key = `staff-imports/${hotelId}/${Date.now()}-${crypto.randomBytes(5).toString("hex")}.csv`;
  const storage = await saveFile(key, buffer, "text/csv");

  return StaffImport.create({
    hotelId,
    originalName,
    fileKey: key,
    storage,
    status: "QUEUED",
  });
};

const lastStaffNumber = async (hotelId) => {
  const last = await Staff.findOne({ hotelId, staffCode: /^STF-\d+$/ })
    .sort({ staffCode: -1 })
    .collation({ locale: "en", numericOrdering: true })
    .select("staffCode")
    .lean();

  return last ? Number(last.staffCode.split("-")[1]) : 1000;
};

const writeErrorReport = async (job, errors) => {
  const lines = [csvLine(["row", "errors", ...TEMPLATE_HEADERS])];

  errors.forEach(({ rowNumber, messages, data }) => {
    lines.push(
      csvLine([
        rowNumber,
        messages.join("; "),
        ...TEMPLATE_HEADERS.map((header) => data[header] ?? ""),
      ]),
    );
  });

  const key = `staff-imports/${job.hotelId}/${job._id}-errors.csv`;
  await saveFile(key, Buffer.from(`﻿${lines.join("")}`, "utf8"), "text/csv");
  return key;
};

export const processImportJob = async (jobId) => {
  const job = await StaffImport.findById(jobId);
  if (!job) return;

  try {
    job.status = "PROCESSING";
    await job.save();

    const hotelId = job.hotelId;
    const text = (await readStoredFile(job.storage, job.fileKey)).toString(
      "utf8",
    );
    const rows = parseCsv(text);

    if (rows.length === 0) throw new Error("The file has no data rows.");
    if (rows.length > MAX_IMPORT_ROWS) {
      throw new Error(`Too many rows (max ${MAX_IMPORT_ROWS} per import).`);
    }

    const [departmentList, designationList] = await Promise.all([
      StaffDepartment.find({ hotelId, isActive: true }).select("name").lean(),
      StaffDesignation.find({ hotelId, isActive: true })
        .select("name departmentId")
        .lean(),
    ]);

    const filePhones = rows
      .map(({ data }) => normalizePhone(data.phone))
      .filter(Boolean);
    const existing = await Staff.find({
      hotelId,
      deletedAt: null,
      phone: { $in: filePhones },
    })
      .select("phone")
      .lean();

    const context = {
      departments: new Map(
        departmentList.map((item) => [item.name.trim().toLowerCase(), item]),
      ),
      designations: new Map(
        designationList.map((item) => [
          `${item.departmentId}:${item.name.trim().toLowerCase()}`,
          item,
        ]),
      ),
      takenPhones: new Set(existing.map((item) => item.phone)),
    };

    const errors = [];
    const valid = [];

    for (const { rowNumber, data } of rows) {
      const { messages, value } = validateRow(data, context);

      if (messages.length > 0) {
        errors.push({ rowNumber, messages, data });
        continue;
      }

      context.takenPhones.add(value.phone);
      valid.push({ rowNumber, data, value });
    }

    let counter = await lastStaffNumber(hotelId);
    valid.forEach((item) => {
      counter += 1;
      item.value.staffCode = `STF-${String(counter).padStart(4, "0")}`;
      item._id = new mongoose.Types.ObjectId();
    });

    let created = 0;

    for (let start = 0; start < valid.length; start += CHUNK_SIZE) {
      const chunk = valid.slice(start, start + CHUNK_SIZE);

      try {
        await Staff.insertMany(
          chunk.map((item) => ({ ...item.value, _id: item._id, hotelId })),
          { ordered: false },
        );
      } catch {}

      const saved = new Set(
        (
          await Staff.find({ _id: { $in: chunk.map((item) => item._id) } })
            .select("_id")
            .lean()
        ).map((item) => String(item._id)),
      );

      chunk.forEach((item) => {
        if (saved.has(String(item._id))) {
          created += 1;
        } else {
          errors.push({
            rowNumber: item.rowNumber,
            messages: [
              "could not be saved (staff code or phone conflict), try this row again",
            ],
            data: item.data,
          });
        }
      });
    }

    errors.sort((a, b) => a.rowNumber - b.rowNumber);

    job.totalRows = rows.length;
    job.createdCount = created;
    job.failedCount = errors.length;
    job.reportKey =
      errors.length > 0 ? await writeErrorReport(job, errors) : "";
    job.status = "COMPLETED";
    job.finishedAt = new Date();
    await job.save();
  } catch (error) {
    console.error("Staff import failed:", error);
    job.status = "FAILED";
    job.errorMessage = error.message;
    job.finishedAt = new Date();
    await job.save();
  }
};
