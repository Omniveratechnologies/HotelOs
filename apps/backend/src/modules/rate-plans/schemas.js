import { z } from "zod";

const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");
const mealPlanSchema = z.enum(["EP", "CP", "MAP", "AP", "AI"]);

// =====================================================
// RATE PLAN CREATION
// =====================================================

export const createRatePlanBodySchema = z.object({
  name: z.string().min(1, "Name is required"),
  roomCode: z.string().min(1, "Room code is required"),
  rate: z.number().nonnegative("Rate must be non-negative"),
  occupancy: z.number().int().positive("Occupancy must be a positive integer"),
  mealPlan: mealPlanSchema.default("EP"),
  ratePlanCode: z.string().optional(),
  isActive: z.boolean().default(true),
});

// =====================================================
// RATE PLAN UPDATE
// =====================================================

export const updateRatePlanBodySchema = z
  .object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    ratePlanCode: z
      .string()
      .min(1, "Rate plan code cannot be empty")
      .optional(),
    roomCode: z.string().min(1, "Room code cannot be empty").optional(),
    roomType: z.string().optional(),
    rate: z.number().nonnegative("Rate must be non-negative").optional(),
    occupancy: z
      .number()
      .int()
      .positive("Occupancy must be a positive integer")
      .optional(),
    mealPlan: mealPlanSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

// =====================================================
// SYNC ALL RATES
// =====================================================

export const syncAllRatesBodySchema = z
  .object({
    startDate: z.string().datetime({ offset: true }).optional(),
    endDate: z.string().datetime({ offset: true }).optional(),
  })
  .refine((data) => data.startDate || data.endDate, {
    message: "At least startDate or endDate must be provided",
  })
  .optional();

// =====================================================
// PARAMS SCHEMAS
// =====================================================

export const ratePlanIdParamsSchema = z.object({
  id: mongoIdSchema,
});
