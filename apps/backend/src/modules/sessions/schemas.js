import { z } from "zod";

const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// =====================================================
// SESSION SCHEMAS
// =====================================================

export const createQrGuestSessionBodySchema = z.object({
  token: z.string().min(1, "Token is required"),
  tableId: mongoIdSchema.optional(),
  roomId: mongoIdSchema.optional(),
  hotelId: mongoIdSchema,
});

export const exchangeKioskHandoffBodySchema = z.object({
  handoffCode: z.string().min(1, "Handoff code is required"),
  deviceId: z.string().optional(),
  deviceType: z.enum(["KIOSK", "TABLET", "MOBILE"]).optional(),
});

export const getKioskRoomStatusQuerySchema = z.object({});

export const validateCurrentSessionQuerySchema = z.object({});

export const revokeCurrentSessionBodySchema = z.object({
  reason: z.string().optional(),
});
