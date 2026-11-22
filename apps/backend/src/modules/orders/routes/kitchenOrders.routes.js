import express from "express";
import {
  getAllOrders,
  updateOrderStatus,
  getOrderById,
  deleteOrder,
  updateOrder,
} from "../controllers/order.controller.js";
import { validate } from "#/shared/middleware/validate.middleware.js";
import {
  orderIdParamsSchema,
  updateOrderBodySchema,
  updateOrderStatusBodySchema,
} from "../schemas.js";

// Public kitchen-facing endpoints (no auth). Used by the Kitchen Dashboard.
const router = express.Router();

router.get("/", getAllOrders);
router.get("/:id", validate({ params: orderIdParamsSchema }), getOrderById);
router.patch(
  "/:id",
  validate({ params: orderIdParamsSchema, body: updateOrderBodySchema }),
  updateOrder,
);
router.patch(
  "/:id/status",
  validate({ params: orderIdParamsSchema, body: updateOrderStatusBodySchema }),
  updateOrderStatus,
);
router.delete("/:id", validate({ params: orderIdParamsSchema }), deleteOrder);

export default router;
