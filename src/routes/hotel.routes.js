import express from "express";
import { createHotel } from "../controllers/hotel.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN"),
  createHotel
);

export default router;