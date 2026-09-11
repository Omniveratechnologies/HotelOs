import express from "express";
import {
  createOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  getHotelOrders,
  createDeskOrder,
  updateHotelOrderStatus,
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

export default router;
