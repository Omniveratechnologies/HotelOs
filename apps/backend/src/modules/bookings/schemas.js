import { z } from "zod";
import { mongoIdSchema, flexibleDateSchema } from "#/shared/schemas/common.js";

const dateOnlySchema = flexibleDateSchema;
const settlementModeSchema = z.enum([
  "CASH",
  "CARD",
  "UPI",
  "BANK_TRANSFER",
  "OTHER",
]);

// =====================================================
// BOOKING QUERY SCHEMAS
// =====================================================

export const getBookingsQuerySchema = z.object({
  status: z
    .enum([
      "confirmed",
      "reserved",
      "pending",
      "draft",
      "checked-in",
      "checked-out",
      "cancelled",
      "no-show",
    ])
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  checkInFrom: dateOnlySchema.optional(),
  checkInTo: dateOnlySchema.optional(),
  checkOutFrom: dateOnlySchema.optional(),
  checkOutTo: dateOnlySchema.optional(),
});

export const getQuoteBodySchema = z.object({
  checkIn: dateOnlySchema,
  checkOut: dateOnlySchema,
  adults: z.number().int().positive().default(1),
  children: z.number().int().nonnegative().default(0),
  roomTypeCode: z.string().optional(),
  ratePlanCode: z.string().optional(),
});

export const getAvailabilityQuerySchema = z.object({
  checkIn: dateOnlySchema,
  checkOut: dateOnlySchema,
  adults: z.number().int().positive().default(1),
  children: z.number().int().nonnegative().default(0),
  roomTypeCode: z.string().optional(),
});

export const getAvailableRoomsQuerySchema = z.object({
  checkIn: dateOnlySchema,
  checkOut: dateOnlySchema,
  roomTypeCode: z.string().optional(),
  adults: z.number().int().positive().default(1),
  children: z.number().int().nonnegative().default(0),
});

export const getBookingStatsQuerySchema = z.object({
  from: dateOnlySchema.optional(),
  to: dateOnlySchema.optional(),
});

export const getArrivalsQuerySchema = z.object({
  date: dateOnlySchema.optional(),
  expressOnly: z.enum(["true", "false"]).optional(),
  q: z.string().optional(),
  bookingId: mongoIdSchema.optional(),
});

export const getDeparturesQuerySchema = z.object({
  q: z.string().optional(),
});

// =====================================================
// BOOKING CREATION
// =====================================================

const guestSchema = z.object({
  name: z.string().min(1, "Guest name is required"),
  email: z.string().email("Valid email required").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  nationality: z.string().optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  documents: z
    .array(
      z.object({
        idType: z.string(),
        idNumber: z.string(),
        front: z
          .object({
            key: z.string(),
            filename: z.string(),
            mimeType: z.string(),
            size: z.number(),
          })
          .optional(),
        back: z
          .object({
            key: z.string(),
            filename: z.string(),
            mimeType: z.string(),
            size: z.number(),
          })
          .optional(),
      }),
    )
    .optional(),
});

const roomRequirementSchema = z.object({
  roomTypeCode: z.string().min(1),
  rooms: z.number().int().positive(),
  adults: z.number().int().positive().default(1),
  children: z.number().int().nonnegative().default(0),
  rate: z.number().nonnegative().optional(),
});

export const createReservationBodySchema = z
  .object({
    name: z.string().optional(),
    email: z.string().optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    idType: z.string().optional(),
    idNumber: z.string().optional(),
    nationality: z.string().optional(),
    designation: z.string().optional(),
    guest: guestSchema.optional(),

    checkIn: dateOnlySchema,
    checkOut: dateOnlySchema,

    roomId: mongoIdSchema.optional(),
    roomTypeCode: z.string().optional(),
    ratePlanId: mongoIdSchema.optional().or(z.string().optional()),
    ratePlanCode: z.string().optional(),
    mealPlan: z.string().optional(),
    rateOverride: z.union([z.number(), z.string()]).optional(),

    rooms: z.coerce.number().int().positive().default(1),
    adults: z.coerce.number().int().positive().default(1),
    children: z.coerce.number().int().nonnegative().default(0),
    infants: z.coerce.number().int().nonnegative().default(0),

    roomRequirements: z.array(roomRequirementSchema).optional(),
    roomAllocations: z.array(z.any()).optional(),

    purpose: z.string().optional(),
    guestType: z.string().optional(),
    specialRequests: z.string().optional(),
    source: z.string().default("DIRECT"),
    status: z.string().default("confirmed"),

    addOns: z.array(z.any()).optional(),
    discount: z.union([z.number(), z.string()]).optional(),
    taxPercent: z.number().nonnegative().optional(),
    paymentStatus: z.string().optional(),
    groupInfo: z.any().optional(),
    guestRoster: z.any().optional(),
    metadata: z.any().optional(),
    documents: z.array(z.any()).optional(),
    files: z.array(z.any()).optional(),
    pricing: z.any().optional(),
  })
  .refine(
    (data) => {
      const hasName = Boolean(data.name?.trim() || data.guest?.name?.trim());
      return hasName;
    },
    {
      message: "Guest name is required",
      path: ["name"],
    },
  )
  .refine(
    (data) => {
      const phone = data.phone?.trim() || data.guest?.phone?.trim();
      const email = data.email?.trim() || data.guest?.email?.trim();
      return Boolean(phone || email);
    },
    {
      message: "Guest phone or email is required",
      path: ["phone"],
    },
  );

// =====================================================
// BOOKING UPDATE
// =====================================================

export const updateBookingBodySchema = z
  .object({
    checkIn: dateOnlySchema.optional(),
    checkOut: dateOnlySchema.optional(),
    adults: z.number().int().positive().optional(),
    children: z.number().int().nonnegative().optional(),
    status: z
      .enum([
        "confirmed",
        "reserved",
        "pending",
        "draft",
        "checked-in",
        "checked-out",
        "cancelled",
        "no-show",
      ])
      .optional(),
    specialRequests: z.string().optional(),
    paymentStatus: z
      .enum(["unpaid", "partially-paid", "paid", "refunded"])
      .optional(),
    roomId: mongoIdSchema.optional(),
    roomRequirements: z.array(roomRequirementSchema).optional(),
    ratePlanCode: z.string().optional(),
    pricing: z
      .object({
        nightlyRate: z.number().nonnegative(),
        grandTotal: z.number().nonnegative(),
        cgst: z.number().nonnegative().default(0),
        sgst: z.number().nonnegative().default(0),
        taxPercent: z.number().nonnegative().default(0),
      })
      .optional(),
    guest: guestSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

// =====================================================
// BOOKING ACTIONS
// =====================================================

export const cancelBookingBodySchema = z.object({
  reason: z.string().optional(),
  cancellationFee: z.number().nonnegative().optional(),
  refundAmount: z.number().nonnegative().optional(),
});

export const reconfirmBookingBodySchema = z.object({
  checkIn: dateOnlySchema.optional(),
  checkOut: dateOnlySchema.optional(),
});

export const changeBookingRoomBodySchema = z.object({
  newRoomId: mongoIdSchema,
  settlementMode: settlementModeSchema.optional(),
  notes: z.string().optional(),
});

export const extendBookingStayBodySchema = z.object({
  newCheckOut: dateOnlySchema,
  settlementMode: settlementModeSchema.optional(),
  notes: z.string().optional(),
});

// =====================================================
// FRONT DESK
// =====================================================

export const checkInBookingBodySchema = z.object({
  roomId: mongoIdSchema.optional(),
  roomIds: z.array(mongoIdSchema).optional(),
  keyCardNumber: z.string().optional(),
  keyCardNumbers: z.array(z.string()).optional(),
  depositAmount: z.number().nonnegative().default(0),
  paymentMode: settlementModeSchema.default("CASH"),
  notes: z.string().optional(),
  documents: z
    .array(
      z.object({
        idType: z.string(),
        idNumber: z.string(),
        front: z.object({
          key: z.string(),
          filename: z.string(),
          mimeType: z.string(),
          size: z.number(),
        }),
        back: z
          .object({
            key: z.string(),
            filename: z.string(),
            mimeType: z.string(),
            size: z.number(),
          })
          .optional(),
      }),
    )
    .optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
});

export const checkOutBookingBodySchema = z.object({
  settlementMode: settlementModeSchema.default("CASH"),
  notes: z.string().optional(),
});

export const getBookingFolioParamsSchema = z.object({
  id: mongoIdSchema,
});

// =====================================================
// PARAMS SCHEMAS
// =====================================================

export const bookingIdParamsSchema = z.object({
  id: mongoIdSchema,
});

// =====================================================
// FRONT DESK QUERY SCHEMAS
// =====================================================

export const getFrontDeskStatsQuerySchema = z.object({});
