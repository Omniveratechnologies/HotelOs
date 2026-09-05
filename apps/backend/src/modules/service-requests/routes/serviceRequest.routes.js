import express from "express";
import {
  createServiceRequest,
  getMyServiceRequests,
  getHotelRequests,
  createDeskRequest,
  updateHotelRequestStatus,
} from "../controllers/serviceRequest.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";

const router = express.Router();

// ---- Staff-facing routes (registered before /:id so they aren't captured) ----
router.get(
  "/staff",
  authenticate,
  authorize("SUB_ADMIN", "RECEPTIONIST"),
  getHotelRequests,
);

router.post(
  "/desk",
  authenticate,
  authorize("SUB_ADMIN", "RECEPTIONIST"),
  createDeskRequest,
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("SUB_ADMIN", "RECEPTIONIST"),
  updateHotelRequestStatus,
);

// ---- Guest-facing routes ----
router.post("/", authenticate, authorize("GUEST"), createServiceRequest);
router.get("/", authenticate, authorize("GUEST"), getMyServiceRequests);

export default router;
