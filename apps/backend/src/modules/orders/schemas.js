import { z } from "zod";

const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");
const orderStatusSchema = z.enum([
  "NEW",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "REJECTED",
  "CANCELLED",
  "CONFIRMED",
]);
const paymentMethodSchema = z.enum(["COD", "ONLINE"]);
// const paymentStatusSchema = z.enum(["PENDING", "PAID", "FAILED"]);
const orderTypeSchema = z.enum(["ROOM_SERVICE", "DINE_IN", "TAKEAWAY"]);

// =====================================================
// ORDER ITEM SCHEMA
// =====================================================

const orderItemSchema = z.object({
  foodItemId: mongoIdSchema,
  recipeId: mongoIdSchema.nullable().optional(),
  quantity: z.number().int().positive().max(100).default(1),
  addons: z
    .array(
      z.object({
        name: z.string(),
        price: z.number().nonnegative(),
      }),
    )
    .optional(),
  specialInstructions: z.string().nullable().optional(),
});

// =====================================================
// GUEST ORDER CREATION (in-room)
// =====================================================

export const createOrderBodySchema = z.object({
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  paymentMethod: paymentMethodSchema.default("COD"),
});

// =====================================================
// PAYMENT VERIFICATION
// =====================================================

export const verifyPaymentBodySchema = z.object({
  orderId: mongoIdSchema,
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

// =====================================================
// TABLE ORDER CREATION (QR guest)
// =====================================================

export const createTableOrderBodySchema = z
  .object({
    items: z
      .array(
        orderItemSchema.extend({
          addons: z
            .array(
              z.object({
                name: z.string(),
                price: z.number().nonnegative(),
              }),
            )
            .optional(),
        }),
      )
      .min(1, "At least one item is required"),
    orderType: orderTypeSchema.default("DINE_IN"),
    couponCode: z.string().optional(),
    notes: z.string().optional(),
    paymentMode: z.enum(["PAY_NOW", "PAY_LATER"]).default("PAY_LATER"),
    idempotencyKey: z.string().optional(),
    tableId: mongoIdSchema.optional(),
  })
  .refine((data) => data.paymentMode !== "PAY_NOW" || true, {
    message: "Payment mode PAY_NOW requires online payment setup",
  })
  .optional();

// =====================================================
// TABLE ORDER PAYMENT VERIFICATION
// =====================================================

export const verifyTableOrderPaymentBodySchema = z.object({
  orderId: mongoIdSchema,
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

// =====================================================
// MARK PAYMENT FAILED
// =====================================================

export const markPaymentFailedBodySchema = z.object({
  orderId: mongoIdSchema,
});

// =====================================================
// DESK ORDER CREATION (staff)
// =====================================================

export const createDeskOrderBodySchema = z.object({
  roomId: mongoIdSchema,
  items: z
    .array(
      z.object({
        foodItemId: mongoIdSchema,
        recipeId: mongoIdSchema.nullable().optional(),
        quantity: z.number().int().positive().max(100).default(1),
      }),
    )
    .min(1, "At least one item is required"),
});

// =====================================================
// UPDATE HOTEL ORDER STATUS (staff)
// =====================================================

export const updateHotelOrderStatusBodySchema = z.object({
  status: orderStatusSchema,
});

// =====================================================
// KITCHEN ORDER UPDATE
// =====================================================

export const updateOrderBodySchema = z.object({
  guestId: mongoIdSchema.nullable().optional(),
  roomId: mongoIdSchema.nullable().optional(),
  items: z
    .array(
      z.object({
        foodItemId: mongoIdSchema,
        recipeId: mongoIdSchema.nullable().optional(),
        name: z.string().min(1),
        price: z.number().nonnegative(),
        quantity: z.number().int().positive(),
      }),
    )
    .optional(),
});

// =====================================================
// KITCHEN ORDER STATUS UPDATE
// =====================================================

export const updateOrderStatusBodySchema = z.object({
  status: orderStatusSchema,
});

// =====================================================
// PARAMS SCHEMAS
// =====================================================

export const orderIdParamsSchema = z.object({
  id: mongoIdSchema,
});

export const orderIdParamsSchemaGuest = z
  .object({
    id: mongoIdSchema,
  })
  .optional();

// =====================================================
// QUERY SCHEMAS
// =====================================================

export const getHotelOrdersQuerySchema = z.object({
  status: orderStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
