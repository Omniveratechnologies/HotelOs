import { z } from "zod";
import {
  flexibleDateSchema,
  flexibleDateOptionalSchema,
} from "#/shared/schemas/common.js";

const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// =====================================================
// LEAVE REQUEST SCHEMAS
// =====================================================

export const applyLeaveBodySchema = z.object({
  leaveTypeId: mongoIdSchema,
  fromDate: flexibleDateSchema,
  toDate: flexibleDateSchema,
  reason: z.string().min(1, "Reason is required"),
  attachment: z.string().url("Invalid attachment URL").optional(),
});

export const approveLeaveBodySchema = z.object({
  notes: z.string().optional(),
});

export const rejectLeaveBodySchema = z.object({
  reason: z.string().min(1, "Rejection reason is required"),
});

export const cancelLeaveBodySchema = z.object({
  reason: z.string().optional(),
});

export const listLeavesQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
  leaveTypeId: mongoIdSchema.optional(),
  staffId: mongoIdSchema.optional(),
  fromDate: flexibleDateOptionalSchema,
  toDate: flexibleDateOptionalSchema,
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const leaveStatsQuerySchema = z.object({
  date_from: flexibleDateOptionalSchema,
  date_to: flexibleDateOptionalSchema,
  department_id: mongoIdSchema.optional(),
});

export const staffLeaveBalanceQuerySchema = z.object({
  id: mongoIdSchema,
  year: z.coerce.number().int().positive().optional(),
});

export const listNotificationsQuerySchema = z.object({
  unreadOnly: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const markNotificationsReadBodySchema = z.object({
  notificationIds: z
    .array(mongoIdSchema)
    .min(1, "At least one notification ID is required"),
});

// =====================================================
// LEAVE TYPE SCHEMAS
// =====================================================

export const listLeaveTypesQuerySchema = z.object({
  isActive: z.enum(["true", "false"]).optional(),
});

// =====================================================
// PARAMS SCHEMAS
// =====================================================

export const leaveIdParamsSchema = z.object({
  id: mongoIdSchema,
});

export const leaveTypeIdParamsSchema = z.object({
  id: mongoIdSchema,
});

export const staffIdParamsSchema = z.object({
  id: mongoIdSchema,
});
