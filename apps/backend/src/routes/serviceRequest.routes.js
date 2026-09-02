import express from "express";
import {
  createServiceRequest,
  getMyServiceRequests,
} from "../controllers/serviceRequest.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

router.post("/", authenticate, authorize("GUEST"), createServiceRequest);
router.get("/", authenticate, authorize("GUEST"), getMyServiceRequests);

export default router;
