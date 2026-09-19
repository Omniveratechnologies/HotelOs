import express from "express";
import {
  getAllOrders,
  updateOrderStatus,
  getOrderById,
  deleteOrder,
  updateOrder,
} from "../controllers/order.controller.js";

// Public kitchen-facing endpoints (no auth). Used by the Kitchen Dashboard.
const router = express.Router();

router.get("/", getAllOrders);
router.get("/:id", getOrderById);
router.patch("/:id", updateOrder);
router.patch("/:id/status", updateOrderStatus);
router.delete("/:id", deleteOrder);

export default router;
