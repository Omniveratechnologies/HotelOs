import express from "express";
import {
  createOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  getHotelOrders,
  createDeskOrder,
  updateHotelOrderStatus,
  createTableOrder,
  verifyTableOrderPayment,
  markPaymentFailed,
  getSessionOrders,
  getPublicOrder,
} from "../controllers/order.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";
import { authenticateSession } from "#/shared/middleware/sessionAuth.middleware.js";
import { createRateLimiter } from "#/shared/middleware/rateLimiter.middleware.js";
import { validate } from "#/shared/middleware/validate.middleware.js";
import {
  createOrderBodySchema,
  verifyPaymentBodySchema,
  createTableOrderBodySchema,
  verifyTableOrderPaymentBodySchema,
  markPaymentFailedBodySchema,
  createDeskOrderBodySchema,
  updateHotelOrderStatusBodySchema,
  orderIdParamsSchema,
} from "../schemas.js";

const router = express.Router();

const orderCreateLimiter = createRateLimiter({
  prefix: "order-create",
  windowMs: 60000,
  max: 10,
  message: "Too many orders placed in a short period. Please wait 1 minute.",
  keyGenerator: (req) =>
    (req.session ? req.session._id.toString() : req.ip) || "anonymous",
});

// ---- Staff-facing routes (registered before /:id so they aren't captured) ----
router.get(
  "/staff",
  authenticate,
  authorize("SUB_ADMIN", "RECEPTIONIST"),
  getHotelOrders,
);

router.post(
  "/desk",
  authenticate,
  authorize("SUB_ADMIN", "RECEPTIONIST"),
  validate({ body: createDeskOrderBodySchema }),
  createDeskOrder,
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("SUB_ADMIN", "RECEPTIONIST"),
  validate({
    params: orderIdParamsSchema,
    body: updateHotelOrderStatusBodySchema,
  }),
  updateHotelOrderStatus,
);

// ---- Table-Order (Guest dining table & kiosk sessions) routes ----
router.post(
  "/table-order",
  authenticateSession({ requireLocation: true }),
  orderCreateLimiter,
  validate({ body: createTableOrderBodySchema }),
  createTableOrder,
);
router.get(
  "/table-order",
  authenticateSession({ requireLocation: false }),
  getSessionOrders,
);
router.post(
  "/table-order/verify-payment",
  authenticateSession({ requireLocation: false }),
  validate({ body: verifyTableOrderPaymentBodySchema }),
  verifyTableOrderPayment,
);
router.get(
  "/table-order/:id",
  authenticateSession({ requireLocation: false }),
  getPublicOrder,
);
router.post(
  "/table-order/payment-failed",
  authenticateSession({ requireLocation: false }),
  validate({ body: markPaymentFailedBodySchema }),
  markPaymentFailed,
);

// ---- In-room Guest routes ----
router.post(
  "/",
  authenticate,
  authorize("GUEST"),
  validate({ body: createOrderBodySchema }),
  createOrder,
);
router.post(
  "/verify-payment",
  authenticate,
  authorize("GUEST"),
  validate({ body: verifyPaymentBodySchema }),
  verifyPayment,
);
router.get("/", authenticate, authorize("GUEST"), getMyOrders);
router.get(
  "/:id",
  authenticate,
  authorize("GUEST"),
  validate({ params: orderIdParamsSchema }),
  getOrderById,
);
export default router;
