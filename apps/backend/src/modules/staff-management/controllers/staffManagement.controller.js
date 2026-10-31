import mongoose from "mongoose";
import { stringify } from "csv-stringify/sync";
import {
  Staff,
  StaffDepartment,
  StaffDesignation,
  FaceEmbedding,
} from "../models/staffManagement.js";
import {
  ApiError,
  getHotelId,
  isObjectId,
  route,
} from "../../../utils/http.js";
import {
  deleteStaffPhotoByUrl,
  uploadStaffPhoto,
} from "../services/photoStorage.service.js";

import { StaffImport } from "../models/staffImport.js";
import {
  TEMPLATE_HEADERS,
  createImportJob,
  csvLine,
  processImportJob,
  readStoredFile,
} from "../services/staffImport.service.js";
import { StaffShift } from "../models/staffShift.js";
import * as service from "../services/designation.service.js";

const hotel = (req) => {
  const id =
    req.user?.hotelId ||
    req.user?.hotel?._id ||
    process.env.STAFF_DEFAULT_HOTEL_ID;

  if (!id || !mongoose.isValidObjectId(id)) {
    const e = new Error(
      "Hotel context missing; auth middleware must set req.user.hotelId.",
    );
    e.status = 400;
    throw e;
  }

  return new mongoose.Types.ObjectId(id);
};

const fail = (res, e) => {
  if (!e.status || e.status >= 500) console.error("[staff]", e);
  res.status(e.status || (e.code === 11000 ? 409 : 500)).json({
    success: false,
    message:
      e.code === 11000
        ? "Staff code or phone already exists for this hotel."
        : e.message || "Staff request failed.",
  });
};

const activeFilter = (hotelId) => ({ hotelId, deletedAt: null });

const payload = (body) => {
  const allowed = [
    "staffCode",
    "name",
    "phone",
    "email",
    "dob",
    "address",
    "govIdType",
    "govIdEnc",
    "departmentId",
    "designationId",
    "shiftId",
    "managerId",
    "employmentType",
    "status",
    "joinedOn",
    "photoUrl",
    "notes",
  ];

  return Object.fromEntries(
    allowed
      .filter((k) => body[k] !== undefined)
      .map((k) => [
        k,
        body[k] === "" && ["dob", "shiftId", "managerId"].includes(k)
          ? null
          : body[k],
      ]),
  );
};

export const listStaff = async (req, res) => {
  try {
    const hotelId = hotel(req);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));

    const q = { ...activeFilter(hotelId) };

    if (req.query.search?.trim()) {
      const term = req.query.search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      q.$or = ["name", "staffCode", "phone", "email"].map((k) => ({
        [k]: new RegExp(term, "i"),
      }));
    }

    if (
      req.query.department_id &&
      mongoose.isValidObjectId(req.query.department_id)
    ) {
      q.departmentId = req.query.department_id;
    }

    if (
      req.query.designation_id &&
      mongoose.isValidObjectId(req.query.designation_id)
    ) {
      q.designationId = req.query.designation_id;
    }

    if (
      ["ACTIVE", "INACTIVE"].includes(String(req.query.status).toUpperCase())
    ) {
      q.status = String(req.query.status).toUpperCase();
    }

    if (req.query.joined_from || req.query.joined_to) {
      q.joinedOn = {};

      if (req.query.joined_from) {
        q.joinedOn.$gte = new Date(req.query.joined_from);
      }

      if (req.query.joined_to) {
        q.joinedOn.$lte = new Date(`${req.query.joined_to}T23:59:59.999Z`);
      }
    }

    const sortAllowed = [
      "name",
      "staffCode",
      "joinedOn",
      "status",
      "createdAt",
    ];

    const sort = sortAllowed.includes(req.query.sort)
      ? req.query.sort
      : "joinedOn";

    const direction = req.query.direction === "asc" ? 1 : -1;

    const [items, total] = await Promise.all([
      Staff.find(q)
        .populate("departmentId", "name")
        .populate("designationId", "name")
        .sort({ [sort]: direction, _id: direction })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Staff.countDocuments(q),
    ]);

    const ids = items.map((s) => s._id);

    const registered = await FaceEmbedding.distinct("staffId", {
      hotelId,
      staffId: { $in: ids },
    });

    const set = new Set(registered.map(String));

    res.json({
      success: true,
      data: items.map((s) => ({
        ...s,
        department: s.departmentId?.name || "-",
        designation: s.designationId?.name || "-",
        faceStatus: set.has(String(s._id)) ? "REGISTERED" : "NOT_REGISTERED",
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (e) {
    fail(res, e);
  }
};

export const stats = async (req, res) => {
  try {
    const h = hotel(req);
    const start = new Date();

    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const [total, active, inactive, joinedThisMonth] = await Promise.all([
      Staff.countDocuments(activeFilter(h)),
      Staff.countDocuments({ ...activeFilter(h), status: "ACTIVE" }),
      Staff.countDocuments({ ...activeFilter(h), status: "INACTIVE" }),
      Staff.countDocuments({
        ...activeFilter(h),
        joinedOn: { $gte: start },
      }),
    ]);

    res.json({
      success: true,
      data: { total, active, inactive, joinedThisMonth },
    });
  } catch (e) {
    fail(res, e);
  }
};

export const getStaff = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid staff ID." });
    }

    const h = hotel(req);

    const s = await Staff.findOne({
      _id: req.params.id,
      ...activeFilter(h),
    })
      .populate("departmentId", "name")
      .populate("designationId", "name")
      .lean();

    if (!s) {
      return res
        .status(404)
        .json({ success: false, message: "Staff not found." });
    }

    const face = await FaceEmbedding.exists({
      hotelId: h,
      staffId: s._id,
    });

    res.json({
      success: true,
      data: {
        ...s,
        department: s.departmentId?.name,
        designation: s.designationId?.name,
        faceStatus: face ? "REGISTERED" : "NOT_REGISTERED",
      },
    });
  } catch (e) {
    fail(res, e);
  }
};

export const createStaff = async (req, res) => {
  try {
    const h = hotel(req);
    const b = payload(req.body);

    if (
      !b.name?.trim() ||
      !b.phone?.trim()
      // !b.departmentId ||
      // !b.designationId
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, department and designation are required.",
      });
    }

    if (!b.staffCode) {
      const count = await Staff.countDocuments({ hotelId: h });
      b.staffCode = `STF-${String(1001 + count).padStart(4, "0")}`;
    }

    const data = await Staff.create({ ...b, hotelId: h });

    res.status(201).json({
      success: true,
      data,
      message: "Staff created.",
    });
  } catch (e) {
    fail(res, e);
  }
};

export const updateStaff = async (req, res) => {
  try {
    const h = hotel(req);

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid staff ID." });
    }

    const current = await Staff.findOne({
      _id: req.params.id,
      ...activeFilter(h),
    });

    if (!current) {
      return res
        .status(404)
        .json({ success: false, message: "Staff not found." });
    }

    const b = payload(req.body);
    // const dep = b.departmentId || current.departmentId;
    // const des = b.designationId || current.designationId;

    // await validRefs(h, dep, des);

    Object.assign(current, b);

    await current.save();

    res.json({
      success: true,
      data: current,
      message: "Staff updated.",
    });
  } catch (e) {
    fail(res, e);
  }
};

export const archiveStaff = async (req, res) => {
  try {
    const s = await Staff.findOneAndUpdate(
      {
        _id: req.params.id,
        ...activeFilter(hotel(req)),
      },
      { $set: { deletedAt: new Date() } },
      { new: true },
    );

    if (!s) {
      return res
        .status(404)
        .json({ success: false, message: "Staff not found." });
    }

    res.json({
      success: true,
      message: "Staff archived; historical records are retained.",
    });
  } catch (e) {
    fail(res, e);
  }
};

export const designations = async (req, res) => {
  try {
    const q = {
      hotelId: hotel(req),
      isActive: true,
    };

    if (
      req.query.departmentId &&
      mongoose.isValidObjectId(req.query.departmentId)
    ) {
      q.departmentId = req.query.departmentId;
    }

    const data = await StaffDesignation.find(q).sort({ name: 1 }).lean();

    res.json({ success: true, data });
  } catch (e) {
    fail(res, e);
  }
};

export const exportCsv = async (req, res) => {
  try {
    const h = hotel(req);
    const q = { ...activeFilter(h) };

    if (req.query.department_id) {
      q.departmentId = req.query.department_id;
    }

    if (req.query.designation_id) {
      q.designationId = req.query.designation_id;
    }

    if (req.query.status) {
      q.status = req.query.status;
    }

    if (req.query.search) {
      q.$or = ["name", "staffCode", "phone", "email"].map((k) => ({
        [k]: new RegExp(
          String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "i",
        ),
      }));
    }

    const rows = await Staff.find(q)
      .populate("departmentId", "name")
      .populate("designationId", "name")
      .lean();

    const csv = stringify(
      rows.map((s) => ({
        staffCode: s.staffCode,
        name: s.name,
        phone: s.phone,
        email: s.email,
        department: s.departmentId?.name,
        designation: s.designationId?.name,
        status: s.status,
        joinedOn: s.joinedOn,
      })),
      { header: true },
    );

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="staff-export.csv"',
    );

    res.send(csv);
  } catch (e) {
    fail(res, e);
  }
};

const findStaff = async (req) => {
  if (!isObjectId(req.params.id)) throw new ApiError(400, "Invalid staff ID.");
  const hotelId = getHotelId(req);
  const staff = await Staff.findOne({
    _id: req.params.id,
    hotelId,
    deletedAt: null,
  }).select("photoUrl");
  if (!staff) throw new ApiError(404, "Staff not found.");
  return { staff, hotelId };
};

// POST /staffManagement/:id/photo   (multipart, field name "photo")
export const uploadPhoto = route(async (req, res) => {
  if (!req.file)
    throw new ApiError(400, "Choose a photo to upload (field name: photo).");
  const { staff, hotelId } = await findStaff(req);

  const { url } = await uploadStaffPhoto({
    buffer: req.file.buffer,
    hotelId,
    staffId: staff._id,
  });
  const oldUrl = staff.photoUrl;

  staff.photoUrl = url;
  await staff.save();
  await deleteStaffPhotoByUrl(oldUrl);

  res.json({
    success: true,
    message: "Photo updated.",
    data: { photoUrl: url },
  });
});

// DELETE /staffManagement/:id/photo
export const removePhoto = route(async (req, res) => {
  const { staff } = await findStaff(req);
  const oldUrl = staff.photoUrl;

  staff.photoUrl = "";
  await staff.save();
  await deleteStaffPhotoByUrl(oldUrl);

  res.json({
    success: true,
    message: "Photo removed.",
    data: { photoUrl: "" },
  });
});

const validateShift = ({ name, startTime, endTime }) => {
  if (!name?.trim() || !startTime || !endTime) {
    throw new ApiError(400, "Name, start time and end time are required.");
  }

  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    throw new ApiError(400, "Times must use HH:mm format.");
  }
};

export const listShifts = route(async (req, res) => {
  const hotelId = getHotelId(req);

  const data = await StaffShift.find({
    hotelId,
    isActive: true,
  })
    .sort({ name: 1 })
    .lean();

  res.json({ success: true, data });
});

export const createShift = route(async (req, res) => {
  const hotelId = getHotelId(req);
  const { name, startTime, endTime } = req.body;

  validateShift({ name, startTime, endTime });

  const data = await StaffShift.create({
    hotelId,
    name: name.trim(),
    startTime,
    endTime,
  });

  res.status(201).json({
    success: true,
    message: "Shift created.",
    data,
  });
});

export const updateShift = route(async (req, res) => {
  const hotelId = getHotelId(req);

  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, "Invalid shift ID.");
  }

  const { name, startTime, endTime, isActive } = req.body;

  const shift = await StaffShift.findOne({
    _id: req.params.id,
    hotelId,
  });

  if (!shift) throw new ApiError(404, "Shift not found.");

  const changes = {};

  if (name !== undefined) changes.name = name.trim();
  if (startTime !== undefined) changes.startTime = startTime;
  if (endTime !== undefined) changes.endTime = endTime;
  if (isActive !== undefined) changes.isActive = isActive;

  validateShift({
    name: changes.name ?? shift.name,
    startTime: changes.startTime ?? shift.startTime,
    endTime: changes.endTime ?? shift.endTime,
  });

  Object.assign(shift, changes);
  await shift.save();

  res.json({ success: true, message: "Shift updated.", data: shift });
});

export const deactivateShift = route(async (req, res) => {
  const hotelId = getHotelId(req);

  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, "Invalid shift ID.");
  }

  const shift = await StaffShift.findOne({
    _id: req.params.id,
    hotelId,
  });

  if (!shift) throw new ApiError(404, "Shift not found.");

  const assignedCount = await Staff.countDocuments({
    hotelId,
    shiftId: shift._id,
    deletedAt: null,
  });

  if (assignedCount > 0) {
    throw new ApiError(
      409,
      "This shift is assigned to staff. Reassign them before deactivating it.",
    );
  }

  shift.isActive = false;
  await shift.save();

  res.json({ success: true, message: "Shift deactivated." });
});

export const registerStaffFace = async (req, res) => {
  try {
    const hotelId = hotel(req);
    const { id } = req.params;
    const { embeddingRef } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff ID.",
      });
    }

    if (!embeddingRef?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Face embedding reference is required.",
      });
    }

    const staff = await Staff.findOne({
      _id: id,
      hotelId,
      deletedAt: null,
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found.",
      });
    }

    const face = await FaceEmbedding.findOneAndUpdate(
      { hotelId, staffId: staff._id },
      { $set: { embeddingRef: embeddingRef.trim() } },
      { new: true, upsert: true, runValidators: true },
    );

    return res.status(200).json({
      success: true,
      message: "Face registered successfully.",
      data: {
        staffId: staff._id,
        faceStatus: "REGISTERED",
      },
    });
  } catch (e) {
    return fail(res, e);
  }
};

export const getStaffFaceStatus = async (req, res) => {
  try {
    const hotelId = hotel(req);
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff ID.",
      });
    }

    const staff = await Staff.findOne({
      _id: id,
      hotelId,
      deletedAt: null,
    }).select("_id");

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found.",
      });
    }

    const face = await FaceEmbedding.exists({
      hotelId,
      staffId: staff._id,
    });

    return res.json({
      success: true,
      data: {
        staffId: staff._id,
        faceStatus: face ? "REGISTERED" : "NOT_REGISTERED",
      },
    });
  } catch (e) {
    return fail(res, e);
  }
};

export const nextCode = async (req, res) => {
  try {
    const last = await Staff.findOne({
      hotelId: hotel(req),
      staffCode: /^STF-\d+$/,
    })
      .sort({ staffCode: -1 })
      .collation({ locale: "en", numericOrdering: true })
      .select("staffCode")
      .lean();
    const n = last ? Number(last.staffCode.split("-")[1]) : 1000;
    res.json({
      success: true,
      data: { staffCode: `STF-${String(n + 1).padStart(4, "0")}` },
    });
  } catch (e) {
    fail(res, e);
  }
};

const findImportJob = async (req) => {
  if (!isObjectId(req.params.jobId)) return null;
  return StaffImport.findOne({
    _id: req.params.jobId,
    hotelId: getHotelId(req),
  });
};

// POST /import   (multipart, field "file", .csv)
export const importStaff = route(async (req, res) => {
  const hotelId = getHotelId(req);

  if (!req.file)
    throw new ApiError(400, "Choose a .csv file to import (field name: file).");

  const job = await createImportJob({
    hotelId,
    originalName: req.file.originalname,
    buffer: req.file.buffer,
  });

  setImmediate(() => {
    processImportJob(job._id).catch((error) =>
      console.error("Staff import failed:", error),
    );
  });

  res
    .status(202)
    .json({ success: true, data: { jobId: job._id, status: job.status } });
});

// GET /import/:jobId
export const getImportJob = route(async (req, res) => {
  const job = await findImportJob(req);
  if (!job) throw new ApiError(404, "Import job not found.");

  res.json({
    success: true,
    data: {
      _id: job._id,
      status: job.status,
      originalName: job.originalName,
      totalRows: job.totalRows,
      createdCount: job.createdCount,
      failedCount: job.failedCount,
      hasErrorReport: Boolean(job.reportKey),
      errorMessage: job.errorMessage,
      finishedAt: job.finishedAt,
    },
  });
});

// GET /import/:jobId/errors   -> downloadable error report (CSV)
export const downloadImportErrors = route(async (req, res) => {
  const job = await findImportJob(req);
  if (!job || !job.reportKey)
    throw new ApiError(404, "There is no error report for this import.");

  const file = await readStoredFile(job.storage, job.reportKey);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="staff-import-errors.csv"',
  );
  res.send(file);
});

// GET /import/template
export const downloadImportTemplate = (req, res) => {
  const sample = [
    "Rahul Kumar",
    "9876543210",
    "rahul@example.com",
    "Front Office",
    "Receptionist",
    "2024-01-12",
    "ACTIVE",
    "FULL_TIME",
    "1995-04-20",
    "Coimbatore",
  ];

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="staff-import-template.csv"',
  );
  res.send(`\uFEFF${csvLine(TEMPLATE_HEADERS)}${csvLine(sample)}`);
};

const COLLATION = { locale: "en", strength: 2 };
const CODE_RE = /^[A-Z0-9]{2,6}$/;
const ICON_RE = /^[a-z][a-z0-9-]{0,29}$/;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

const DEFAULT_ICON = "building";
const DEFAULT_COLOR = "#3b82f6";

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const liveStaff = (hotelId) => ({ hotelId, deletedAt: null });

export const readDepartmentBody = (body = {}, { partial = false } = {}) => {
  const errors = [];
  const value = {};
  const has = (key) => body[key] !== undefined;

  if (!partial || has("name")) {
    const name = String(body.name ?? "")
      .trim()
      .replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 80)
      errors.push("Department name must be 2-80 characters.");
    else value.name = name;
  }

  if (!partial || has("code")) {
    const code = String(body.code ?? "")
      .trim()
      .toUpperCase();
    if (!CODE_RE.test(code))
      errors.push("Department code must be 2-6 letters or digits (e.g. FO).");
    else value.code = code;
  }

  if (has("description")) {
    const description = String(body.description ?? "").trim();
    if (description.length > 300)
      errors.push("Description can be at most 300 characters.");
    else value.description = description;
  }

  if (has("icon")) {
    const icon =
      String(body.icon ?? "")
        .trim()
        .toLowerCase() || DEFAULT_ICON;
    if (!ICON_RE.test(icon)) errors.push("Icon is not valid.");
    else value.icon = icon;
  }

  if (has("color")) {
    const color = String(body.color ?? "").trim() || DEFAULT_COLOR;
    if (!COLOR_RE.test(color))
      errors.push("Color must be a hex value like #3b82f6.");
    else value.color = color.toLowerCase();
  }

  if (has("status")) {
    const status = String(body.status).toUpperCase();
    if (!["ACTIVE", "INACTIVE"].includes(status))
      errors.push("Status must be ACTIVE or INACTIVE.");
    else value.isActive = status === "ACTIVE";
  } else if (has("isActive")) {
    value.isActive = Boolean(body.isActive);
  }

  return { errors, value };
};

const findDepartment = async (req) => {
  const hotelId = getHotelId(req);
  const key = String(req.params.id ?? "").trim();
  const filter = isObjectId(key) ? { _id: key } : { code: key.toUpperCase() };

  const department = await StaffDepartment.findOne({ hotelId, ...filter });
  if (!department) throw new ApiError(404, "Department not found.");

  return { hotelId, department };
};

const assertUnique = async (hotelId, value, ignoreId) => {
  const others = ignoreId ? { _id: { $ne: ignoreId } } : {};

  if (value.name) {
    const clash = await StaffDepartment.findOne({
      hotelId,
      name: value.name,
      ...others,
    })
      .collation(COLLATION)
      .select("_id");
    if (clash)
      throw new ApiError(
        409,
        `A department named "${value.name}" already exists.`,
      );
  }

  if (value.code) {
    const clash = await StaffDepartment.findOne({
      hotelId,
      code: value.code,
      ...others,
    })
      .collation(COLLATION)
      .select("_id");
    if (clash)
      throw new ApiError(
        409,
        `Department code "${value.code}" is already used.`,
      );
  }
};

const duplicateError = (error) => {
  if (error?.code !== 11000) return error;
  const field = Object.keys(error.keyPattern || {}).includes("code")
    ? "code"
    : "name";
  return new ApiError(
    409,
    field === "code"
      ? "This department code is already used."
      : "A department with this name already exists.",
  );
};

const view = (department, counts = {}) => ({
  _id: department._id,
  name: department.name,
  code: department.code || "",
  description: department.description || "",
  icon: department.icon || DEFAULT_ICON,
  color: department.color || DEFAULT_COLOR,
  isActive: department.isActive,
  status: department.isActive ? "ACTIVE" : "INACTIVE",
  staffCount: counts.total ?? 0,
  createdAt: department.createdAt,
  updatedAt: department.updatedAt,
});

const staffCounts = async (hotelId, departmentIds) => {
  const rows = await Staff.aggregate([
    { $match: { ...liveStaff(hotelId), departmentId: { $in: departmentIds } } },
    {
      $group: {
        _id: "$departmentId",
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0] } },
        inactive: { $sum: { $cond: [{ $eq: ["$status", "INACTIVE"] }, 1, 0] } },
      },
    },
  ]);

  return new Map(rows.map((row) => [String(row._id), row]));
};

export const listDepartments = route(async (req, res) => {
  const hotelId = getHotelId(req);
  const status = String(req.query.status || "ACTIVE").toUpperCase();
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 100));

  const query = { hotelId };
  if (status === "ACTIVE") query.isActive = true;
  if (status === "INACTIVE") query.isActive = false;

  const search = String(req.query.search || "").trim();
  if (search) {
    const term = new RegExp(escapeRegex(search), "i");
    query.$or = [{ name: term }, { code: term }, { description: term }];
  }

  const [items, total] = await Promise.all([
    StaffDepartment.find(query)
      .sort({ name: 1, _id: 1 })
      .collation(COLLATION)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    StaffDepartment.countDocuments(query),
  ]);

  const counts = await staffCounts(
    hotelId,
    items.map((item) => item._id),
  );

  res.json({
    success: true,
    data: items.map((item) => view(item, counts.get(String(item._id)))),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

export const departmentStats = route(async (req, res) => {
  const hotelId = getHotelId(req);

  const [total, active, inactive, totalStaff] = await Promise.all([
    StaffDepartment.countDocuments({ hotelId }),
    StaffDepartment.countDocuments({ hotelId, isActive: true }),
    StaffDepartment.countDocuments({ hotelId, isActive: false }),
    Staff.countDocuments({
      ...liveStaff(hotelId),
      departmentId: { $ne: null },
    }),
  ]);

  res.json({ success: true, data: { total, active, inactive, totalStaff } });
});

// POST /departments
export const createDepartment = route(async (req, res) => {
  const hotelId = getHotelId(req);
  const { errors, value } = readDepartmentBody(req.body);

  if (errors.length) throw new ApiError(400, errors[0], errors);

  await assertUnique(hotelId, value);

  let department;
  try {
    department = await StaffDepartment.create({
      icon: DEFAULT_ICON,
      color: DEFAULT_COLOR,
      isActive: true,
      ...value,
      hotelId,
    });
  } catch (error) {
    throw duplicateError(error);
  }

  res
    .status(201)
    .json({
      success: true,
      message: "Department created.",
      data: view(department),
    });
});

// GET /departments/:id   (id or code)
export const getDepartment = route(async (req, res) => {
  const { hotelId, department } = await findDepartment(req);
  const counts = await staffCounts(hotelId, [department._id]);

  res.json({
    success: true,
    data: view(department, counts.get(String(department._id))),
  });
});

// PUT /departments/:id
export const updateDepartment = route(async (req, res) => {
  const { hotelId, department } = await findDepartment(req);
  const { errors, value } = readDepartmentBody(req.body, { partial: true });

  if (errors.length) throw new ApiError(400, errors[0], errors);

  await assertUnique(
    hotelId,
    {
      ...(value.name &&
      value.name.toLowerCase() !== department.name.toLowerCase()
        ? { name: value.name }
        : {}),
      ...(value.code && value.code !== department.code
        ? { code: value.code }
        : {}),
    },
    department._id,
  );

  Object.assign(department, value);

  try {
    await department.save();
  } catch (error) {
    throw duplicateError(error);
  }

  const counts = await staffCounts(hotelId, [department._id]);

  res.json({
    success: true,
    message: "Department updated.",
    data: view(department, counts.get(String(department._id))),
  });
});

// GET /departments/:id/summary  -> everything the right-side drawer shows
export const departmentSummary = route(async (req, res) => {
  const { hotelId, department } = await findDepartment(req);

  const [counts, designationCount, recent] = await Promise.all([
    staffCounts(hotelId, [department._id]),
    StaffDesignation.countDocuments({
      hotelId,
      departmentId: department._id,
      isActive: true,
    }),
    Staff.find({ ...liveStaff(hotelId), departmentId: department._id })
      .sort({ joinedOn: -1, _id: -1 })
      .limit(4)
      .populate("designationId", "name")
      .select("name staffCode photoUrl status joinedOn designationId")
      .lean(),
  ]);

  const count = counts.get(String(department._id)) || {
    total: 0,
    active: 0,
    inactive: 0,
  };

  res.json({
    success: true,
    data: {
      department: view(department, count),
      designationCount,
      counts: {
        total: count.total,
        active: count.active,
        inactive: count.inactive,

        onLeave: 0,
      },
      recentStaff: recent.map((member) => ({
        _id: member._id,
        name: member.name,
        staffCode: member.staffCode,
        photoUrl: member.photoUrl || "",
        status: member.status,
        joinedOn: member.joinedOn,
        designation: member.designationId?.name || "-",
      })),
    },
  });
});

// GET /departments/:id/designations?status=ALL|ACTIVE|INACTIVE
export const departmentDesignations = route(async (req, res) => {
  const { hotelId, department } = await findDepartment(req);
  const status = String(req.query.status || "ACTIVE").toUpperCase();

  const query = { hotelId, departmentId: department._id };
  if (status === "ACTIVE") query.isActive = true;
  if (status === "INACTIVE") query.isActive = false;

  const designations = await StaffDesignation.find(query)
    .sort({ name: 1 })
    .collation(COLLATION)
    .lean();

  const rows = await Staff.aggregate([
    { $match: { ...liveStaff(hotelId), departmentId: department._id } },
    { $group: { _id: "$designationId", total: { $sum: 1 } } },
  ]);
  const byDesignation = new Map(
    rows.map((row) => [String(row._id), row.total]),
  );

  res.json({
    success: true,
    data: designations.map((item) => ({
      _id: item._id,
      name: item.name,
      isActive: item.isActive,
      staffCount: byDesignation.get(String(item._id)) || 0,
    })),
  });
});

// DELETE /departments/:id

export const deleteDepartment = route(async (req, res) => {
  const { hotelId, department } = await findDepartment(req);

  const staffNow = await Staff.countDocuments({
    ...liveStaff(hotelId),
    departmentId: department._id,
  });
  if (staffNow > 0) {
    throw new ApiError(
      409,
      `${department.name} still has ${staffNow} staff member(s). Reassign them first, or deactivate the department instead.`,
    );
  }

  const [designations, archivedStaff] = await Promise.all([
    StaffDesignation.countDocuments({ hotelId, departmentId: department._id }),
    Staff.countDocuments({ hotelId, departmentId: department._id }),
  ]);

  if (designations > 0 || archivedStaff > 0) {
    department.isActive = false;
    await department.save();
    return res.json({
      success: true,
      message:
        "This department has designations or past staff records, so it was deactivated instead of deleted.",
      data: { deactivated: true },
    });
  }

  await department.deleteOne();
  return res.json({
    success: true,
    message: "Department deleted.",
    data: { deleted: true },
  });
});

// GET /designations?search=&department_id=&status=ALL&sort=&direction=&page=&limit=
export const listDesignations = route(async (req, res) => {
  const { rows, pagination } = await service.listDesignations(
    getHotelId(req),
    req.query,
  );
  res.json({ success: true, data: rows, pagination });
});

// GET /designations/stats  -> the four cards
export const designationStats = route(async (req, res) => {
  res.json({
    success: true,
    data: await service.designationStats(getHotelId(req)),
  });
});

// GET /designations/:id   (id or code)
export const getDesignation = route(async (req, res) => {
  res.json({
    success: true,
    data: await service.getDesignation(getHotelId(req), req.params.id),
  });
});

// POST /designations
export const createDesignation = route(async (req, res) => {
  const data = await service.createDesignation(getHotelId(req), req.body);
  res
    .status(201)
    .json({ success: true, message: "Designation created.", data });
});

// PUT /designations/:id
export const updateDesignation = route(async (req, res) => {
  const data = await service.updateDesignation(
    getHotelId(req),
    req.params.id,
    req.body,
  );
  res.json({ success: true, message: "Designation updated.", data });
});

// DELETE /designations/:id
export const deleteDesignation = route(async (req, res) => {
  const { message, ...data } = await service.deleteDesignation(
    getHotelId(req),
    req.params.id,
  );
  res.json({ success: true, message, data });
});
