import { z } from "zod";

export const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

export const flexibleDateSchema = z
  .string()
  .refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format. Expected YYYY-MM-DD or ISO 8601 string",
  });

export const flexibleDateOptionalSchema = z
  .string()
  .refine((val) => !val || !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  })
  .nullable()
  .optional()
  .or(z.literal(""))
  .transform((val) => (val === "" || val === null ? undefined : val));

export const optionalEmailSchema = z
  .string()
  .email("Invalid email address")
  .optional()
  .or(z.literal(""))
  .transform((val) => (val === "" ? undefined : val));
