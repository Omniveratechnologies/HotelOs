import { z } from "zod";

const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// =====================================================
// FOOD ITEM CREATION
// =====================================================

export const createFoodItemBodySchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    price: z.number().nonnegative("Price must be non-negative"),
    category: z.string().optional(),
    image: z.string().optional(),
    isAvailable: z.boolean().default(true),
    isVeg: z.boolean().optional(),
    foodType: z.enum(["veg", "non-veg"]).optional(),
    isSpicy: z.boolean().optional(),
    isChefSpecial: z.boolean().optional(),
    isRoomServiceAvailable: z.boolean().optional(),
    stock: z.number().nonnegative().optional(),
    availability: z.string().optional(),
  })
  .passthrough();

// =====================================================
// FOOD ITEM UPDATE
// =====================================================

export const updateFoodItemBodySchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    price: z.number().nonnegative().optional(),
    category: z.string().optional(),
    image: z.string().optional(),
    isAvailable: z.boolean().optional(),
    isVeg: z.boolean().optional(),
    foodType: z.enum(["veg", "non-veg"]).optional(),
    isSpicy: z.boolean().optional(),
    isChefSpecial: z.boolean().optional(),
    isRoomServiceAvailable: z.boolean().optional(),
    stock: z.number().nonnegative().optional(),
    availability: z.string().optional(),
  })
  .passthrough()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

// =====================================================
// PARAMS SCHEMAS
// =====================================================

export const foodItemIdParamsSchema = z.object({
  id: mongoIdSchema,
});

export const hotelIdParamsSchema = z.object({
  hotelId: mongoIdSchema,
});
