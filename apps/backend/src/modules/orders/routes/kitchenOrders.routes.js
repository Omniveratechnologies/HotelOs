import express from "express";
import {
  getAllOrders,
  updateOrderStatus,
} from "../controllers/order.controller.js";

// Public kitchen-facing endpoints (no auth). Used by the Kitchen Dashboard.
const router = express.Router();

router.get("/", getAllOrders);
router.patch("/:id/status", updateOrderStatus);

export default router;
