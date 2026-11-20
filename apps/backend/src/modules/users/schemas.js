import { z } from "zod";

const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// =====================================================
// USER CREATION
// =====================================================

export const createUserBodySchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.enum(["KITCHEN", "RECEPTIONIST"], { message: "Invalid user role" }),
});

// =====================================================
// USER QUERY
// =====================================================

export const getUsersQuerySchema = z.object({
  role: z
    .enum(["SUPER_ADMIN", "SUB_ADMIN", "RECEPTIONIST", "KITCHEN", "GUEST"])
    .optional(),
});

// =====================================================
// PARAMS SCHEMAS
// =====================================================

export const userIdParamsSchema = z.object({
  id: mongoIdSchema,
});
