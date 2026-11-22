import { z } from "zod";

const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// =====================================================
// USER CREATION
// =====================================================

export const createUserBodySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      "Username can only contain alphanumeric characters, underscores, hyphens, and dots",
    )
    .optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address"),
  role: z.enum(["SUB_ADMIN", "KITCHEN", "RECEPTIONIST"], {
    message: "Invalid user role",
  }),
  hotelId: mongoIdSchema.optional(),
  isActive: z.boolean().optional(),
});

// =====================================================
// USER UPDATE
// =====================================================

export const updateUserBodySchema = z.object({
  name: z.string().trim().min(1, "Name is required").optional(),
  email: z
    .string()
    .trim()
    .min(1, "Email cannot be empty")
    .email("Invalid email address")
    .optional(),
  role: z
    .enum(["SUB_ADMIN", "KITCHEN", "RECEPTIONIST"], {
      message: "Invalid user role",
    })
    .optional(),
  isActive: z.boolean().optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
});

// =====================================================
// RESET PASSWORD
// =====================================================

export const resetUserPasswordBodySchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// =====================================================
// RESTORE USER
// =====================================================

export const restoreUserBodySchema = z.object({
  newUsername: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      "Username can only contain alphanumeric characters, underscores, hyphens, and dots",
    )
    .optional(),
});

// =====================================================
// USER QUERY
// =====================================================

export const getUsersQuerySchema = z.object({
  role: z
    .enum([
      "ALL",
      "SUPER_ADMIN",
      "SUB_ADMIN",
      "RECEPTIONIST",
      "KITCHEN",
      "GUEST",
    ])
    .optional(),
  hotelId: mongoIdSchema.optional(),
  search: z.string().trim().optional(),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE", "DELETED"]).optional(),
  includeDeleted: z.union([z.string(), z.boolean()]).optional(),
});

// =====================================================
// DELETE QUERY
// =====================================================

export const deleteUserQuerySchema = z.object({
  permanent: z.union([z.string(), z.boolean()]).optional(),
});

// =====================================================
// PARAMS SCHEMAS
// =====================================================

export const userIdParamsSchema = z.object({
  id: mongoIdSchema,
});
