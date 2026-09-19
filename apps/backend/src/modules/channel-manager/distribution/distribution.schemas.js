import { z } from "zod";

// Common date validation
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format");

// Query schemas
export const getLiveRatesQuerySchema = z.object({
  hotelId: z.string().optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
});

export const getLiveInventoryQuerySchema = z.object({
  hotelId: z.string().optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
});

// Rate update schemas
const rateUpdateSchema = z.object({
  roomCode: z.string().min(1, "roomCode is required"),
  rate: z.number().nonnegative("rate must be non-negative"),
  rateplanCode: z.string().min(1, "rateplanCode is required"),
});

const rateUpdateBlockSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
  rates: z.array(rateUpdateSchema).min(1, "At least one rate is required"),
});

export const updateRatesBodySchema = z.object({
  updates: z
    .array(rateUpdateBlockSchema)
    .min(1, "At least one update block is required"),
  hotelId: z.string().optional(),
});

export const updateRateRestrictionsBodySchema = z.object({
  updates: z
    .array(
      z.object({
        startDate: dateSchema,
        endDate: dateSchema,
        rooms: z
          .array(
            z.object({
              roomCode: z.string().min(1),
              restriction: z.string().optional(),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
  hotelId: z.string().optional(),
});

// Inventory update schemas
const inventoryUpdateSchema = z.object({
  roomCode: z.string().min(1, "roomCode is required"),
  available: z
    .number()
    .int()
    .nonnegative("available must be a non-negative integer"),
});

const inventoryUpdateBlockSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
  rooms: z.array(inventoryUpdateSchema).min(1, "At least one room is required"),
});

export const updateInventoryBodySchema = z.object({
  updates: z
    .array(inventoryUpdateBlockSchema)
    .min(1, "At least one update block is required"),
  hotelId: z.string().optional(),
});

export const updateInventoryRestrictionsBodySchema = z.object({
  updates: z
    .array(
      z.object({
        startDate: dateSchema,
        endDate: dateSchema,
        rooms: z
          .array(
            z.object({
              roomCode: z.string().min(1),
              restriction: z.string().optional(),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
  hotelId: z.string().optional(),
});

// Mark no-show schema
export const markNoShowBodySchema = z.object({
  bookingId: z.string().min(1, "bookingId is required"),
  hotelId: z.string().optional(),
});

// Validation middleware factory
export function validate(schema, source = "body") {
  return (req, res, next) => {
    const data = req[source];
    const result = schema.safeParse(data);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    req[source] = result.data;
    next();
  };
}
