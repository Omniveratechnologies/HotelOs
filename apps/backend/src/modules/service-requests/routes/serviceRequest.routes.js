import express from "express";
import {
  createServiceRequest,
  getMyServiceRequests,
  getHotelServiceRequests,
} from "../controllers/serviceRequest.controller.js";
import { authenticate } from "#src/shared/middleware/auth.middleware.js";
import { authorize } from "#src/shared/middleware/role.middleware.js";

const router = express.Router();

router.post("/", authenticate, authorize("GUEST"), createServiceRequest);
router.get(
  "/hotel",
  authenticate,
  authorize("RECEPTIONIST", "SUB_ADMIN"),
  getHotelServiceRequests,
);
router.get("/", authenticate, authorize("GUEST"), getMyServiceRequests);

export default router;
