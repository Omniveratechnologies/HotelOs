import express from "express";
import {
  getFoodItems,
  createFoodItem,
} from "../controllers/foodItem.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/", authenticate, getFoodItems);
router.post(
  "/",
  authenticate,
  authorize("SUB_ADMIN", "KITCHEN"),
  createFoodItem,
);

export default router;
