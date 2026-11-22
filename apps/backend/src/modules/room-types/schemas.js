import { z } from "zod";

const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// =====================================================
// ROOM TYPE CREATION
// =====================================================

const roomSchema = z.object({
  roomNumber: z.string().min(1, "Room number is required"),
  rate: z.number().nonnegative("Rate must be non-negative"),
  floor: z.number().int().nonnegative("Floor must be a non-negative integer"),
});

export const createRoomTypeBodySchema = z
  .object({
    roomCode: z.string().min(1, "Room code is required"),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    count: z.number().int().positive("Count must be a positive integer"),
    active: z.boolean().default(true),
    minOccupancy: z
      .number()
      .int()
      .positive("Min occupancy must be a positive integer")
      .default(1),
    maxOccupancy: z
      .number()
      .int()
      .nonnegative("Max occupancy must be a non-negative integer")
      .nullable()
      .optional(),
    rooms: z.array(roomSchema),
  })
  .refine((data) => data.rooms.length === data.count, {
    message: (data) => `Provide details for exactly ${data.count} room(s)`,
    path: ["rooms"],
  })
  .refine(
    (data) => {
      const roomNumbers = data.rooms.map((r) => r.roomNumber.toLowerCase());
      return new Set(roomNumbers).size === roomNumbers.length;
    },
    {
      message: "Duplicate room numbers found",
      path: ["rooms"],
    },
  )
  .refine(
    (data) => {
      if (data.maxOccupancy !== null && data.maxOccupancy !== undefined) {
        return data.maxOccupancy >= data.minOccupancy;
      }
      return true;
    },
    {
      message: "Max occupancy must be greater than or equal to min occupancy",
      path: ["maxOccupancy"],
    },
  );

// =====================================================
// ROOM TYPE UPDATE
// =====================================================

export const updateRoomTypeBodySchema = z
  .object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    description: z.string().optional(),
    active: z.boolean().optional(),
    minOccupancy: z
      .number()
      .int()
      .positive("Min occupancy must be a positive integer")
      .optional(),
    maxOccupancy: z
      .number()
      .int()
      .nonnegative("Max occupancy must be a non-negative integer")
      .nullable()
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  })
  .refine(
    (data) => {
      if (
        data.minOccupancy !== undefined &&
        data.maxOccupancy !== undefined &&
        data.maxOccupancy !== null
      ) {
        return data.maxOccupancy >= data.minOccupancy;
      }
      return true;
    },
    {
      message: "Max occupancy must be greater than or equal to min occupancy",
      path: ["maxOccupancy"],
    },
  );

// =====================================================
// PARAMS SCHEMAS
// =====================================================

export const roomTypeIdParamsSchema = z.object({
  id: mongoIdSchema,
});
