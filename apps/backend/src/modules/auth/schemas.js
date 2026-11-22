import { z } from "zod";

const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// =====================================================
// PASSWORD STRENGTH SCHEMA
// =====================================================

const passwordStrengthSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must not exceed 128 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character")
  .refine((val) => !/\s/.test(val), "Password must not contain whitespace");

// =====================================================
// PORTAL ENUM & SCHEMAS
// =====================================================

export const portalEnum = z.enum([
  "SUPER_ADMIN",
  "SUB_ADMIN",
  "RECEPTIONIST",
  "KITCHEN",
  "GUEST",
]);

// =====================================================
// LOGIN SCHEMA
// =====================================================

export const loginBodySchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  expectedRole: z
    .enum(["SUPER_ADMIN", "SUB_ADMIN", "RECEPTIONIST", "KITCHEN", "GUEST"])
    .optional(),
});

// =====================================================
// FORGOT USERNAME SCHEMA
// =====================================================

export const forgotUsernameBodySchema = z.object({
  email: z.string().email("Invalid email address"),
  portal: portalEnum.optional(),
});

// =====================================================
// FORGOT PASSWORD SCHEMA
// =====================================================

export const forgotPasswordBodySchema = z
  .object({
    identifier: z.string().min(1, "Identifier is required").optional(),
    email: z.string().optional(),
    portal: portalEnum.optional(),
  })
  .refine(
    (data) =>
      (typeof data.identifier === "string" &&
        data.identifier.trim().length > 0) ||
      (typeof data.email === "string" && data.email.trim().length > 0),
    {
      message: "Email or username is required",
      path: ["identifier"],
    },
  );

// =====================================================
// RESET PASSWORD ACCOUNT SELECTION SCHEMAS
// =====================================================

export const getResetAccountsQuerySchema = z.object({
  token: z.string().min(1, "Selection token is required"),
});

export const selectResetAccountBodySchema = z.object({
  token: z.string().min(1, "Selection token is required"),
  username: z.string().min(1, "Username is required"),
});

// =====================================================
// RESET PASSWORD SCHEMA
// =====================================================

export const resetPasswordBodySchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordStrengthSchema,
});

// =====================================================
// CREATE SUB ADMIN SCHEMA
// =====================================================

export const createSubAdminBodySchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must not exceed 50 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscore, and hyphen",
    ),
  email: z.string().email("Invalid email address"),
  password: passwordStrengthSchema,
  hotelId: mongoIdSchema,
});

// =====================================================
// CHANGE PASSWORD SCHEMA (for authenticated users)
// =====================================================

export const changePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordStrengthSchema,
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// =====================================================
// PARAMS SCHEMAS
// =====================================================

export const userIdParamsSchema = z.object({
  id: mongoIdSchema,
});
