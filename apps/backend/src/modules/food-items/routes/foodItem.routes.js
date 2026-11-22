import express from "express";
import {
  getFoodItems,
  createFoodItem,
  getPublicFoodItems,
  updateFoodItem,
  deleteFoodItem,
} from "../controllers/foodItem.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";

const router = express.Router();

router.get("/", authenticate, getFoodItems);
router.post(
  "/",
  authenticate,
  authorize("SUB_ADMIN", "KITCHEN", "RECEPTIONIST"),
  createFoodItem,
);
router.patch(
  "/:id",
  authenticate,
  authorize("SUB_ADMIN", "KITCHEN", "RECEPTIONIST"),
  updateFoodItem,
);
router.delete(
  "/:id",
  authenticate,
  authorize("SUB_ADMIN", "KITCHEN", "RECEPTIONIST"),
  deleteFoodItem,
);
router.get("/public/:hotelId", getPublicFoodItems);

export default router;
