import { z } from "zod";
import {
  flexibleDateSchema,
  flexibleDateOptionalSchema,
} from "#/shared/schemas/common.js";

const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// =====================================================
// HOLIDAY SCHEMAS
// =====================================================

export const createHolidayBodySchema = z.object({
  name: z.string().min(1, "Holiday name is required"),
  date: flexibleDateSchema,
  type: z
    .enum(["NATIONAL", "REGIONAL", "COMPANY", "RELIGIOUS", "OTHER"])
    .default("OTHER"),
  isRecurring: z.boolean().default(false),
  description: z.string().optional(),
  location: z.string().optional(),
});

export const updateHolidayBodySchema = z
  .object({
    name: z.string().min(1).optional(),
    date: flexibleDateOptionalSchema,
    type: z
      .enum(["NATIONAL", "REGIONAL", "COMPANY", "RELIGIOUS", "OTHER"])
      .optional(),
    isRecurring: z.boolean().optional(),
    description: z.string().optional(),
    location: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const listHolidaysQuerySchema = z.object({
  type: z
    .enum(["NATIONAL", "REGIONAL", "COMPANY", "RELIGIOUS", "OTHER"])
    .optional(),
  isRecurring: z.enum(["true", "false"]).optional(),
  date_from: flexibleDateOptionalSchema,
  date_to: flexibleDateOptionalSchema,
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const summaryQuerySchema = z.object({
  year: z.coerce.number().int().positive().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export const upcomingQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(365).default(30),
});

export const calendarQuerySchema = z.object({
  year: z.coerce.number().int().positive().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export const importHolidaysBodySchema = z.object({
  holidays: z
    .array(
      z.object({
        name: z.string().min(1),
        date: flexibleDateSchema,
        type: z
          .enum(["NATIONAL", "REGIONAL", "COMPANY", "RELIGIOUS", "OTHER"])
          .default("OTHER"),
        isRecurring: z.boolean().default(false),
        description: z.string().optional(),
        location: z.string().optional(),
      }),
    )
    .min(1, "At least one holiday is required"),
});

export const seedNationalBodySchema = z.object({
  year: z.coerce.number().int().positive(),
  country: z.string().min(1, "Country code is required").default("IN"),
});

// =====================================================
// PARAMS SCHEMAS
// =====================================================

export const holidayIdParamsSchema = z.object({
  id: mongoIdSchema,
});
