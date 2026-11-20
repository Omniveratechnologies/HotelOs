import { z } from "zod";

const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");
const roomStatusSchema = z.enum([
  "available",
  "occupied",
  "reserved",
  "cleaning",
]);

// =====================================================
// ROOM CREATION
// =====================================================

export const createRoomBodySchema = z
  .object({
    roomNumber: z.string().min(1, "Room number is required"),
    type: z.string().optional(),
    rate: z.number().nonnegative("Rate must be non-negative"),
    floor: z.number().int(),
    roomCode: z.string().optional().nullable(),
  })
  .refine((data) => data.type || data.roomCode, {
    message: "Either type or roomCode is required",
    path: ["type"],
  });

// =====================================================
// ROOM UPDATE
// =====================================================

export const updateRoomBodySchema = z
  .object({
    status: roomStatusSchema.optional(),
    type: z.string().min(1, "Room type cannot be empty").optional(),
    rate: z.number().nonnegative("Rate must be non-negative").optional(),
    floor: z.number().int().optional(),
    currentGuest: z.string().nullable().optional(),
    checkIn: z.string().datetime({ offset: true }).nullable().optional(),
    checkOut: z.string().datetime({ offset: true }).nullable().optional(),
    roomCode: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

// =====================================================
// CHECK-OUT ROOM
// =====================================================

export const checkOutRoomBodySchema = z.object({
  settlementMode: z
    .enum(["CASH", "CARD", "UPI", "BANK_TRANSFER", "OTHER"])
    .default("CASH"),
  notes: z.string().optional(),
});

// =====================================================
// PARAMS SCHEMAS
// =====================================================

export const roomIdParamsSchema = z.object({
  id: mongoIdSchema,
});

// =====================================================
// QUERY SCHEMAS
// =====================================================

export const getRoomsQuerySchema = z.object({
  hotelId: mongoIdSchema.optional(),
  status: roomStatusSchema.optional(),
});
