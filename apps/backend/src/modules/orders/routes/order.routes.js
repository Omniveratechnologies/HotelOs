import express from "express";
import {
  createOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
} from "../controllers/order.controller.js";
import { authenticate } from "../../../shared/middleware/auth.middleware.js";
import { authorize } from "../../../shared/middleware/role.middleware.js";

const router = express.Router();

router.post("/", authenticate, authorize("GUEST"), createOrder);
router.post("/verify-payment", authenticate, authorize("GUEST"), verifyPayment);
router.get("/", authenticate, authorize("GUEST"), getMyOrders);
router.get("/:id", authenticate, authorize("GUEST"), getOrderById);

export default router;
