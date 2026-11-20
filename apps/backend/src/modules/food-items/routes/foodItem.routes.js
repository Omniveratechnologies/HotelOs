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
import { validate } from "#/shared/middleware/validate.middleware.js";
import {
  createFoodItemBodySchema,
  updateFoodItemBodySchema,
  foodItemIdParamsSchema,
  hotelIdParamsSchema,
} from "../schemas.js";

const router = express.Router();

router.get("/", authenticate, getFoodItems);
router.post(
  "/",
  authenticate,
  authorize("SUB_ADMIN", "KITCHEN", "RECEPTIONIST"),
  validate({ body: createFoodItemBodySchema }),
  createFoodItem,
);
router.patch(
  "/:id",
  authenticate,
  authorize("SUB_ADMIN", "KITCHEN", "RECEPTIONIST"),
  validate({ params: foodItemIdParamsSchema, body: updateFoodItemBodySchema }),
  updateFoodItem,
);
router.delete(
  "/:id",
  authenticate,
  authorize("SUB_ADMIN", "KITCHEN", "RECEPTIONIST"),
  validate({ params: foodItemIdParamsSchema }),
  deleteFoodItem,
);
router.get(
  "/public/:hotelId",
  validate({ params: hotelIdParamsSchema }),
  getPublicFoodItems,
);

export default router;
