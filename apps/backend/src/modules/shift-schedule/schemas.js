import { z } from "zod";
import {
  flexibleDateSchema,
  flexibleDateOptionalSchema,
} from "#/shared/schemas/common.js";

const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// =====================================================
// SHIFT SCHEMAS
// =====================================================

export const createShiftBodySchema = z.object({
  name: z.string().min(1, "Shift name is required"),
  code: z.string().min(1, "Shift code is required"),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Start time must be HH:MM format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time must be HH:MM format"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be hex format")
    .optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateShiftBodySchema = z
  .object({
    name: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
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

export const listShiftsQuerySchema = z.object({
  isActive: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// =====================================================
// SCHEDULE SCHEMAS
// =====================================================

export const listScheduleQuerySchema = z.object({
  staff_id: mongoIdSchema.optional(),
  date_from: flexibleDateOptionalSchema,
  date_to: flexibleDateOptionalSchema,
  shift_id: mongoIdSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const calendarQuerySchema = z.object({
  date_from: flexibleDateOptionalSchema,
  date_to: flexibleDateOptionalSchema,
});

export const rosterQuerySchema = z.object({
  date: flexibleDateOptionalSchema,
  department_id: mongoIdSchema.optional(),
});

export const assignBodySchema = z.object({
  staffId: mongoIdSchema,
  shiftId: mongoIdSchema,
  date: flexibleDateSchema,
});

export const bulkAssignBodySchema = z.object({
  assignments: z
    .array(
      z.object({
        staffId: mongoIdSchema,
        shiftId: mongoIdSchema,
        date: flexibleDateSchema,
      }),
    )
    .min(1, "At least one assignment is required"),
});

export const autoScheduleBodySchema = z.object({
  date_from: flexibleDateSchema,
  date_to: flexibleDateSchema,
  department_id: mongoIdSchema.optional(),
  shift_pattern: z.enum(["ROTATING", "FIXED"]).default("ROTATING"),
});

export const clearScheduleBodySchema = z.object({
  date_from: flexibleDateSchema,
  date_to: flexibleDateSchema,
  department_id: mongoIdSchema.optional(),
});

export const reportQuerySchema = z.object({
  date_from: flexibleDateSchema,
  date_to: flexibleDateSchema,
  department_id: mongoIdSchema.optional(),
});

export const summaryQuerySchema = z.object({
  date_from: flexibleDateOptionalSchema,
  date_to: flexibleDateOptionalSchema,
});

// =====================================================
// PARAMS SCHEMAS
// =====================================================

export const shiftIdParamsSchema = z.object({
  id: mongoIdSchema,
});

export const shiftScheduleIdParamsSchema = z.object({
  id: mongoIdSchema,
});
