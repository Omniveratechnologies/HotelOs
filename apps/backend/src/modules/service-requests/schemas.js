import { z } from "zod";

const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");
const requestStatusSchema = z.enum([
  "REQUESTED",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);
const requestTypeSchema = z.enum([
  "HOUSEKEEPING",
  "MAINTENANCE",
  "CONCIERGE",
  "ROOM_SERVICE",
  "EMERGENCY",
  "OTHER",
]);

// =====================================================
// SERVICE REQUEST CREATION (guest in-room)
// =====================================================

export const createServiceRequestBodySchema = z.object({
  type: requestTypeSchema,
  description: z.string().optional(),
  items: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number().int().positive(),
      }),
    )
    .optional(),
  details: z.record(z.unknown()).optional(),
});

// =====================================================
// TABLE ORDER SERVICE REQUEST
// =====================================================

export const createTableOrderServiceRequestBodySchema = z.object({
  type: requestTypeSchema,
  description: z.string().optional(),
  items: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number().int().positive(),
      }),
    )
    .optional(),
  details: z.record(z.unknown()).optional(),
  hotelId: mongoIdSchema.optional(),
  tableId: mongoIdSchema.optional(),
});

// =====================================================
// DESK REQUEST CREATION (staff)
// =====================================================

export const createDeskRequestBodySchema = z.object({
  roomId: mongoIdSchema,
  type: requestTypeSchema,
  description: z.string().optional(),
  items: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number().int().positive(),
      }),
    )
    .optional(),
  priority: z.enum(["normal", "high", "low"]).default("normal"),
});

// =====================================================
// UPDATE REQUEST STATUS
// =====================================================

export const updateRequestStatusBodySchema = z.object({
  status: requestStatusSchema,
});

// =====================================================
// PARAMS SCHEMAS
// =====================================================

export const requestIdParamsSchema = z.object({
  id: mongoIdSchema,
});

// =====================================================
// QUERY SCHEMAS
// =====================================================

export const getHotelRequestsQuerySchema = z.object({
  status: requestStatusSchema.optional(),
  type: requestTypeSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
