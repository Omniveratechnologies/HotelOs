import { z } from "zod";

const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// =====================================================
// 2FA SCHEMAS
// =====================================================

// Setup 2FA - returns secret and QR code data
export const setupTwoFactorBodySchema = z.object({});

// Verify 2FA token during setup
export const verifyTwoFactorSetupBodySchema = z.object({
  token: z
    .string()
    .length(6, "Token must be 6 digits")
    .regex(/^\d{6}$/, "Token must be 6 digits"),
});

// Disable 2FA - requires current password + token/backup code
export const disableTwoFactorBodySchema = z
  .object({
    password: z.string().min(1, "Password is required"),
    token: z
      .string()
      .length(6, "Token must be 6 digits")
      .regex(/^\d{6}$/, "Token must be 6 digits")
      .optional(),
    backupCode: z
      .string()
      .min(8, "Backup code must be 8 characters")
      .max(8, "Backup code must be 8 characters")
      .optional(),
  })
  .refine((data) => data.token || data.backupCode, {
    message: "Either token or backup code is required",
    path: ["token"],
  });

// Verify 2FA token during login
export const verifyTwoFactorLoginBodySchema = z
  .object({
    userId: mongoIdSchema,
    token: z
      .string()
      .length(6, "Token must be 6 digits")
      .regex(/^\d{6}$/, "Token must be 6 digits")
      .optional(),
    backupCode: z
      .string()
      .min(8, "Backup code must be 8 characters")
      .max(8, "Backup code must be 8 characters")
      .optional(),
    rememberDevice: z.boolean().default(false).optional(),
  })
  .refine((data) => data.token || data.backupCode, {
    message: "Either token or backup code is required",
    path: ["token"],
  });

// Regenerate backup codes
export const regenerateBackupCodesBodySchema = z
  .object({
    password: z.string().min(1, "Password is required"),
    token: z
      .string()
      .length(6, "Token must be 6 digits")
      .regex(/^\d{6}$/, "Token must be 6 digits")
      .optional(),
    backupCode: z
      .string()
      .min(8, "Backup code must be 8 characters")
      .max(8, "Backup code must be 8 characters")
      .optional(),
  })
  .refine((data) => data.token || data.backupCode, {
    message: "Either token or backup code is required",
    path: ["token"],
  });

// Get 2FA status
export const twoFactorStatusParamsSchema = z.object({
  id: mongoIdSchema.optional(),
});

// 2FA setup response schema (for documentation)
export const twoFactorSetupResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    secret: z.string(),
    qrCodeUrl: z.string(),
    backupCodes: z.array(z.string()),
    manualEntryKey: z.string(),
  }),
});

export const twoFactorStatusResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    enabled: z.boolean(),
    required: z.boolean(),
    backupCodesRemaining: z.number(),
  }),
});

export const twoFactorVerifyResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    token: z.string().optional(),
    user: z.object({}).optional(),
  }),
});
