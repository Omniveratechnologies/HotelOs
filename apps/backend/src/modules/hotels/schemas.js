import { z } from "zod";

// Common reusable schemas
const dateSchema = z.string().datetime({ offset: true });
const timeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Time must be HH:MM format");
const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// =====================================================
// HOTEL CREATION
// =====================================================

export const createHotelBodySchema = z
  .object({
    name: z.string().min(1, "Hotel name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().default("India"),
    currency: z.string().default("INR"),
    gstin: z.string().optional(),
    taxPercent: z.number().nonnegative("Tax percentage must be non-negative"),
    checkInTime: timeSchema,
    checkOutTime: timeSchema,
    cancellationPolicy: z.string().optional(),
    termsAndConditions: z.string().optional(),
    wifiNetworkName: z.string().optional(),
    wifiPassword: z.string().optional(),
    subscriptionStartDate: dateSchema,
    subscriptionEndDate: dateSchema,
    aiosellHotelCode: z.string().optional(),
  })
  .refine((data) => data.checkInTime !== data.checkOutTime, {
    message: "Check-out time must differ from check-in time",
    path: ["checkOutTime"],
  })
  .refine(
    (data) =>
      new Date(data.subscriptionEndDate) > new Date(data.subscriptionStartDate),
    {
      message: "Subscription end date must be after start date",
      path: ["subscriptionEndDate"],
    },
  );

// =====================================================
// HOTEL UPDATE (SUPER_ADMIN)
// =====================================================

export const updateHotelBodySchema = z
  .object({
    name: z.string().min(1, "Hotel name cannot be empty").optional(),
    email: z.string().email("Invalid email").optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().optional(),
    currency: z.string().optional(),
    gstin: z.string().optional(),
    taxPercent: z
      .number()
      .nonnegative("Tax percentage must be non-negative")
      .optional(),
    checkInTime: timeSchema.optional(),
    checkOutTime: timeSchema.optional(),
    cancellationPolicy: z.string().optional(),
    termsAndConditions: z.string().optional(),
    wifiNetworkName: z.string().optional(),
    wifiPassword: z.string().optional(),
    subscriptionStartDate: dateSchema.optional(),
    subscriptionEndDate: dateSchema.optional(),
    aiosellHotelCode: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  })
  .refine(
    (data) => {
      if (data.checkInTime && data.checkOutTime) {
        return data.checkInTime !== data.checkOutTime;
      }
      return true;
    },
    {
      message: "Check-out time must differ from check-in time",
      path: ["checkOutTime"],
    },
  )
  .refine(
    (data) => {
      if (data.subscriptionStartDate && data.subscriptionEndDate) {
        return (
          new Date(data.subscriptionEndDate) >
          new Date(data.subscriptionStartDate)
        );
      }
      return true;
    },
    {
      message: "Subscription end date must be after start date",
      path: ["subscriptionEndDate"],
    },
  );

// =====================================================
// HOTEL STATUS UPDATE
// =====================================================

export const updateHotelStatusBodySchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"], {
    message: "Status must be ACTIVE or INACTIVE",
  }),
});

// =====================================================
// MY HOTEL UPDATE (SUB_ADMIN self-service)
// =====================================================

export const updateMyHotelBodySchema = z
  .object({
    name: z.string().min(1, "Hotel name cannot be empty").optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().optional(),
    currency: z.string().optional(),
    gstin: z.string().optional(),
    taxPercent: z
      .number()
      .nonnegative("Tax percentage must be non-negative")
      .optional(),
    cancellationPolicy: z.string().optional(),
    termsAndConditions: z.string().optional(),
    checkInTime: timeSchema.optional(),
    checkOutTime: timeSchema.optional(),
    wifiNetworkName: z.string().nullable().optional(),
    wifiPassword: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  })
  .refine(
    (data) => {
      if (data.checkInTime && data.checkOutTime) {
        return data.checkInTime !== data.checkOutTime;
      }
      return true;
    },
    {
      message: "Check-out time must differ from check-in time",
      path: ["checkOutTime"],
    },
  );

// =====================================================
// CHANNEL MANAGER CONFIG
// =====================================================

export const updateChannelManagerConfigBodySchema = z
  .object({
    pmsSlug: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    baseUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
    isEnabled: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

// =====================================================
// AISELL HOTEL CODE
// =====================================================

export const setHotelAiosellCodeBodySchema = z.object({
  aiosellHotelCode: z.string().optional(),
});

// =====================================================
// SYNC FROM AISELL
// =====================================================

export const syncFromAiosellParamsSchema = z.object({
  hotelId: mongoIdSchema,
});

// =====================================================
// PARAMS SCHEMAS
// =====================================================

export const hotelIdParamsSchema = z.object({
  hotelId: mongoIdSchema,
});

export const approvalIdParamsSchema = z.object({
  approvalId: mongoIdSchema,
});

// =====================================================
// QUERY SCHEMAS
// =====================================================

export const channelApprovalsQuerySchema = z.object({
  kind: z.enum(["ROOM", "RATE_PLAN", "HOTEL", "ROOM_TYPE"]).optional(),
  status: z.enum(["under_review", "completed"]).optional(),
});
