import { z } from "zod";

const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// =====================================================
// KEY CARD SCHEMAS
// =====================================================

export const createKeyCardBodySchema = z.object({
  cardNumber: z.string().min(1, "Card number is required"),
  status: z
    .enum(["AVAILABLE", "ACTIVE", "BLOCKED", "LOST", "DEACTIVATED"])
    .default("AVAILABLE"),
  type: z.enum(["RFID", "MAGNETIC", "NFC", "HYBRID"]).default("RFID"),
  issueDate: z.string().datetime({ offset: true }).optional(),
  expiryDate: z.string().datetime({ offset: true }).optional(),
  notes: z.string().optional(),
});

export const getKeyCardsQuerySchema = z.object({
  status: z
    .enum(["AVAILABLE", "ACTIVE", "BLOCKED", "LOST", "DEACTIVATED"])
    .optional(),
  type: z.enum(["RFID", "MAGNETIC", "NFC", "HYBRID"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const assignKeyCardBodySchema = z.object({
  cardId: mongoIdSchema,
  bookingId: mongoIdSchema,
  guestId: mongoIdSchema.optional(),
  roomId: mongoIdSchema,
  issuedBy: mongoIdSchema.optional(),
  expiresAt: z.string().datetime({ offset: true }).optional(),
});

export const reissueKeyCardBodySchema = z.object({
  newCardId: mongoIdSchema,
  reason: z.string().optional(),
});

export const blockKeyCardBodySchema = z.object({
  reason: z.string().optional(),
});

export const deactivateKeyCardBodySchema = z.object({
  reason: z.string().optional(),
});

// =====================================================
// PARAMS SCHEMAS
// =====================================================

export const keyCardIdParamsSchema = z.object({
  id: mongoIdSchema,
});
