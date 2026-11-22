import { z } from "zod";

const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// =====================================================
// TABLE CREATION
// =====================================================

export const createTableBodySchema = z.object({
  tableNumber: z.string().min(1, "Table number is required"),
  seats: z.number().int().positive("Seats must be a positive integer"),
  section: z.string().optional(),
  status: z
    .enum(["AVAILABLE", "OCCUPIED", "RESERVED", "CLEANING", "MAINTENANCE"])
    .default("AVAILABLE"),
  coordinates: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
  isOrderingEnabled: z.boolean().default(true),
});

// =====================================================
// TABLE UPDATE
// =====================================================

export const updateTableBodySchema = z
  .object({
    tableNumber: z.string().min(1).optional(),
    seats: z.number().int().positive().optional(),
    section: z.string().optional(),
    status: z
      .enum(["AVAILABLE", "OCCUPIED", "RESERVED", "CLEANING", "MAINTENANCE"])
      .optional(),
    coordinates: z
      .object({
        x: z.number(),
        y: z.number(),
      })
      .optional(),
    isOrderingEnabled: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

// =====================================================
// PARAMS SCHEMAS
// =====================================================

export const tableIdParamsSchema = z.object({
  id: mongoIdSchema,
});

export const publicTableParamsSchema = z.object({
  hotelId: mongoIdSchema,
  tableId: mongoIdSchema,
});
