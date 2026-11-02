import { Staff, StaffDepartment } from "../models/staffManagement.js";
import { StaffDesignation } from "../models/staffDesignation.js";
import { ApiError, isObjectId } from "../../../utils/http.js";

const COLLATION = { locale: "en", strength: 2 };
const CODE_RE = /^[A-Z0-9]{2,8}$/;
const MAX_LIMIT = 500;
const SORT_KEYS = ["name", "department", "staffCount", "status", "createdAt"];

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const liveStaff = (hotelId) => ({ hotelId, deletedAt: null });

export const readDesignationBody = (body = {}, { partial = false } = {}) => {
  const errors = [];
  const value = {};
  const has = (key) => body[key] !== undefined;

  if (!partial || has("name")) {
    const name = String(body.name ?? "")
      .trim()
      .replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 80)
      errors.push("Designation name must be 2-80 characters.");
    else value.name = name;
  }

  if (!partial || has("departmentId")) {
    const departmentId = String(body.departmentId ?? "").trim();
    if (!isObjectId(departmentId)) errors.push("Select a department.");
    else value.departmentId = departmentId;
  }

  if (!partial || has("code")) {
    const code = String(body.code ?? "")
      .trim()
      .toUpperCase();
    if (!CODE_RE.test(code))
      errors.push("Designation code must be 2-8 letters or digits (e.g. REC).");
    else value.code = code;
  }

  if (has("description")) {
    const description = String(body.description ?? "").trim();
    if (description.length > 300)
      errors.push("Description can be at most 300 characters.");
    else value.description = description;
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

export const toRow = (designation, department, staffCount = 0) => ({
  _id: designation._id,
  name: designation.name,
  code: designation.code || "",
  description: designation.description || "",
  isActive: designation.isActive,
  status: designation.isActive ? "ACTIVE" : "INACTIVE",
  departmentId: designation.departmentId,
  department: department
    ? {
        _id: department._id,
        name: department.name,
        code: department.code || "",
        color: department.color || "#3b82f6",
        icon: department.icon || "building",
      }
    : null,
  staffCount,
  createdAt: designation.createdAt,
  updatedAt: designation.updatedAt,
});

const textCompare = (a, b) =>
  String(a ?? "").localeCompare(String(b ?? ""), "en", { sensitivity: "base" });

export const sortRows = (rows, sort = "name", direction = "asc") => {
  const key = SORT_KEYS.includes(sort) ? sort : "name";
  const sign = direction === "desc" ? -1 : 1;

  const compare = {
    name: (a, b) => textCompare(a.name, b.name),
    department: (a, b) => textCompare(a.department?.name, b.department?.name),
    staffCount: (a, b) => a.staffCount - b.staffCount,
    status: (a, b) => Number(b.isActive) - Number(a.isActive),
    createdAt: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  }[key];

  return [...rows].sort(
    (a, b) =>
      sign * compare(a, b) ||
      textCompare(a.name, b.name) ||
      String(a._id).localeCompare(String(b._id)),
  );
};

const staffCountMap = async (hotelId) => {
  const rows = await Staff.aggregate([
    { $match: { ...liveStaff(hotelId), designationId: { $ne: null } } },
    { $group: { _id: "$designationId", total: { $sum: 1 } } },
  ]);

  return new Map(rows.map((row) => [String(row._id), row.total]));
};

const findDesignation = async (hotelId, key) => {
  const value = String(key ?? "").trim();
  const filter = isObjectId(value)
    ? { _id: value }
    : { code: value.toUpperCase() };

  const designation = await StaffDesignation.findOne({ hotelId, ...filter });
  if (!designation) throw new ApiError(404, "Designation not found.");

  return designation;
};

const assertActiveDepartment = async (hotelId, departmentId) => {
  const department = await StaffDepartment.findOne({
    _id: departmentId,
    hotelId,
    isActive: true,
  }).lean();
  if (!department)
    throw new ApiError(400, "Select a valid, active department.");
  return department;
};

const assertUnique = async (
  hotelId,
  { name, code, departmentId },
  ignoreId,
) => {
  const others = ignoreId ? { _id: { $ne: ignoreId } } : {};

  if (name) {
    const clash = await StaffDesignation.findOne({
      hotelId,
      departmentId,
      name,
      ...others,
    })
      .collation(COLLATION)
      .select("_id");
    if (clash)
      throw new ApiError(409, `"${name}" already exists in this department.`);
  }

  if (code) {
    const clash = await StaffDesignation.findOne({ hotelId, code, ...others })
      .collation(COLLATION)
      .select("_id");
    if (clash)
      throw new ApiError(409, `Designation code "${code}" is already used.`);
  }
};

const duplicateError = (error) => {
  if (error?.code !== 11000) return error;
  const onCode = Object.keys(error.keyPattern || {}).includes("code");
  return new ApiError(
    409,
    onCode
      ? "This designation code is already used."
      : "This designation already exists in the department.",
  );
};

export const listDesignations = async (hotelId, query = {}) => {
  const status = String(query.status || "ACTIVE").toUpperCase();
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(query.limit) || MAX_LIMIT),
  );

  const filter = { hotelId };
  if (status === "ACTIVE") filter.isActive = true;
  if (status === "INACTIVE") filter.isActive = false;

  const departmentId = query.department_id || query.departmentId;
  if (departmentId && isObjectId(departmentId))
    filter.departmentId = departmentId;

  const search = String(query.search || "").trim();
  if (search) {
    const term = new RegExp(escapeRegex(search), "i");
    const matchingDepartments = await StaffDepartment.find({
      hotelId,
      name: term,
    })
      .select("_id")
      .lean();

    filter.$or = [
      { name: term },
      { code: term },
      { description: term },
      { departmentId: { $in: matchingDepartments.map((item) => item._id) } },
    ];
  }

  const [designations, departments, counts] = await Promise.all([
    StaffDesignation.find(filter).lean(),
    StaffDepartment.find({ hotelId }).select("name code color icon").lean(),
    staffCountMap(hotelId),
  ]);

  const departmentById = new Map(
    departments.map((item) => [String(item._id), item]),
  );

  const rows = sortRows(
    designations.map((item) =>
      toRow(
        item,
        departmentById.get(String(item.departmentId)),
        counts.get(String(item._id)) || 0,
      ),
    ),
    query.sort,
    String(query.direction).toLowerCase() === "desc" ? "desc" : "asc",
  );

  const total = rows.length;

  return {
    rows: rows.slice((page - 1) * limit, page * limit),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

export const designationStats = async (hotelId) => {
  const [total, active, inactive, departmentIds] = await Promise.all([
    StaffDesignation.countDocuments({ hotelId }),
    StaffDesignation.countDocuments({ hotelId, isActive: true }),
    StaffDesignation.countDocuments({ hotelId, isActive: false }),
    StaffDesignation.distinct("departmentId", { hotelId }),
  ]);

  return { total, active, inactive, departments: departmentIds.length };
};

export const getDesignation = async (hotelId, key) => {
  const designation = await findDesignation(hotelId, key);
  const [department, counts] = await Promise.all([
    StaffDepartment.findOne({ _id: designation.departmentId, hotelId })
      .select("name code color icon")
      .lean(),
    staffCountMap(hotelId),
  ]);

  return toRow(
    designation.toObject(),
    department,
    counts.get(String(designation._id)) || 0,
  );
};

export const createDesignation = async (hotelId, body) => {
  const { errors, value } = readDesignationBody(body);
  if (errors.length) throw new ApiError(400, errors[0], errors);

  const department = await assertActiveDepartment(hotelId, value.departmentId);
  await assertUnique(hotelId, value);

  let designation;
  try {
    designation = await StaffDesignation.create({
      isActive: true,
      ...value,
      hotelId,
    });
  } catch (error) {
    throw duplicateError(error);
  }

  return toRow(designation.toObject(), department, 0);
};

export const updateDesignation = async (hotelId, key, body) => {
  const designation = await findDesignation(hotelId, key);
  const { errors, value } = readDesignationBody(body, { partial: true });
  if (errors.length) throw new ApiError(400, errors[0], errors);

  const staffNow = await Staff.countDocuments({
    ...liveStaff(hotelId),
    designationId: designation._id,
  });

  const movesDepartment =
    value.departmentId &&
    String(value.departmentId) !== String(designation.departmentId);
  if (movesDepartment) {
    if (staffNow > 0) {
      throw new ApiError(
        409,
        `${designation.name} is assigned to ${staffNow} staff member(s). Reassign them before moving it to another department.`,
      );
    }
    await assertActiveDepartment(hotelId, value.departmentId);
  }

  const targetDepartment = value.departmentId || designation.departmentId;

  await assertUnique(
    hotelId,
    {
      departmentId: targetDepartment,
      ...(value.name &&
      (value.name.toLowerCase() !== designation.name.toLowerCase() ||
        movesDepartment)
        ? { name: value.name }
        : movesDepartment
          ? { name: designation.name }
          : {}),
      ...(value.code && value.code !== designation.code
        ? { code: value.code }
        : {}),
    },
    designation._id,
  );

  Object.assign(designation, value);

  try {
    await designation.save();
  } catch (error) {
    throw duplicateError(error);
  }

  const department = await StaffDepartment.findOne({
    _id: designation.departmentId,
    hotelId,
  })
    .select("name code color icon")
    .lean();

  return toRow(designation.toObject(), department, staffNow);
};

export const deleteDesignation = async (hotelId, key) => {
  const designation = await findDesignation(hotelId, key);

  const staffNow = await Staff.countDocuments({
    ...liveStaff(hotelId),
    designationId: designation._id,
  });
  if (staffNow > 0) {
    throw new ApiError(
      409,
      `${designation.name} is assigned to ${staffNow} staff member(s). Reassign them first, or deactivate the designation instead.`,
    );
  }

  const pastStaff = await Staff.countDocuments({
    hotelId,
    designationId: designation._id,
  });
  if (pastStaff > 0) {
    designation.isActive = false;
    await designation.save();
    return {
      deactivated: true,
      message:
        "This designation has past staff records, so it was deactivated instead of deleted.",
    };
  }

  await designation.deleteOne();
  return { deleted: true, message: "Designation deleted." };
};
