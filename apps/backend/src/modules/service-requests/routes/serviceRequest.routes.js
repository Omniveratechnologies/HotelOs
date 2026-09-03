import express from "express";
import {
  createServiceRequest,
  getMyServiceRequests,
} from "../controllers/serviceRequest.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";

const router = express.Router();

router.post("/", authenticate, authorize("GUEST"), createServiceRequest);
router.get("/", authenticate, authorize("GUEST"), getMyServiceRequests);

export default router;
