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
  getPublicOrder,
} from "../controllers/order.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";

const router = express.Router();

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
  createDeskOrder,
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("SUB_ADMIN", "RECEPTIONIST"),
  updateHotelOrderStatus,
);

// ---- Guest-facing routes ----
router.post("/", authenticate, authorize("GUEST"), createOrder);
router.post("/verify-payment", authenticate, authorize("GUEST"), verifyPayment);
router.get("/", authenticate, authorize("GUEST"), getMyOrders);
router.get("/:id", authenticate, authorize("GUEST"), getOrderById);
router.post("/table-order", createTableOrder);
router.post("/table-order/verify-payment", verifyTableOrderPayment);
router.get("/table-order/:id", getPublicOrder);
router.post("/table-order/payment-failed", markPaymentFailed);
export default router;
