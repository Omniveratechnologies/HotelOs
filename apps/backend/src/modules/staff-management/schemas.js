import { z } from "zod";

const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// =====================================================
// STAFF SCHEMAS
// =====================================================

export const createStaffBodySchema = z.object({
  staffCode: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
  dob: z.string().datetime({ offset: true }).nullable().optional(),
  address: z.string().optional(),
  govIdType: z.string().optional(),
  govIdEnc: z.string().optional(),
  departmentId: mongoIdSchema.optional(),
  designationId: mongoIdSchema.optional(),
  shiftId: mongoIdSchema.nullable().optional(),
  managerId: mongoIdSchema.nullable().optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  joinedOn: z.string().datetime({ offset: true }).optional(),
  photoUrl: z.string().url("Invalid photo URL").optional(),
  notes: z.string().optional(),
});

export const updateStaffBodySchema = z
  .object({
    staffCode: z.string().optional(),
    name: z.string().min(1).optional(),
    phone: z.string().optional(),
    email: z.string().email("Invalid email").optional(),
    dob: z.string().datetime({ offset: true }).nullable().optional(),
    address: z.string().optional(),
    govIdType: z.string().optional(),
    govIdEnc: z.string().optional(),
    departmentId: mongoIdSchema.optional(),
    designationId: mongoIdSchema.optional(),
    shiftId: mongoIdSchema.nullable().optional(),
    managerId: mongoIdSchema.nullable().optional(),
    employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    joinedOn: z.string().datetime({ offset: true }).optional(),
    photoUrl: z.string().url("Invalid photo URL").optional(),
    notes: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

// =====================================================
// STAFF QUERY SCHEMAS
// =====================================================

export const listStaffQuerySchema = z.object({
  search: z.string().optional(),
  department_id: mongoIdSchema.optional(),
  designation_id: mongoIdSchema.optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  joined_from: z.string().datetime({ offset: true }).optional(),
  joined_to: z.string().datetime({ offset: true }).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sort: z
    .enum(["name", "staffCode", "joinedOn", "status", "createdAt"])
    .default("joinedOn"),
  direction: z.enum(["asc", "desc"]).default("desc"),
});

export const exportCsvQuerySchema = z.object({
  search: z.string().optional(),
  department_id: mongoIdSchema.optional(),
  designation_id: mongoIdSchema.optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

// =====================================================
// SHIFT SCHEMAS
// =====================================================

export const createShiftBodySchema = z.object({
  name: z.string().min(1, "Shift name is required"),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Start time must be HH:MM format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time must be HH:MM format"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be hex format")
    .optional(),
  description: z.string().optional(),
});

export const updateShiftBodySchema = z
  .object({
    name: z.string().min(1).optional(),
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Start time must be HH:MM format")
      .optional(),
    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "End time must be HH:MM format")
      .optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be hex format")
      .optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

// =====================================================
// DEPARTMENT SCHEMAS
// =====================================================

export const createDepartmentBodySchema = z.object({
  name: z.string().min(1, "Department name is required"),
  code: z.string().min(1, "Department code is required"),
  description: z.string().optional(),
});

export const updateDepartmentBodySchema = z
  .object({
    name: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    description: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

// =====================================================
// DESIGNATION SCHEMAS
// =====================================================

export const createDesignationBodySchema = z.object({
  name: z.string().min(1, "Designation name is required"),
  code: z.string().min(1, "Designation code is required"),
  departmentId: mongoIdSchema,
  description: z.string().optional(),
});

export const updateDesignationBodySchema = z
  .object({
    name: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    departmentId: mongoIdSchema.optional(),
    description: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

// =====================================================
// IMPORT SCHEMAS
// =====================================================

export const importStaffBodySchema = z.object({
  // File upload handled by multer middleware
});

// =====================================================
// FACE REGISTRATION
// =====================================================

export const registerStaffFaceBodySchema = z.object({
  embeddings: z.array(z.number()).min(1, "At least one embedding is required"),
});

// =====================================================
// PHOTO UPLOAD
// =====================================================

export const uploadPhotoBodySchema = z.object({
  // File upload handled by multer middleware
});

// =====================================================
// PARAMS SCHEMAS
// =====================================================

export const staffIdParamsSchema = z.object({
  id: mongoIdSchema,
});

export const shiftIdParamsSchema = z.object({
  id: mongoIdSchema,
});

export const departmentIdParamsSchema = z.object({
  id: mongoIdSchema,
});

export const designationIdParamsSchema = z.object({
  id: mongoIdSchema,
});

export const importJobIdParamsSchema = z.object({
  jobId: mongoIdSchema,
});
