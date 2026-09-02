import express from "express";
import { getMyProfile, updateDND } from "../controllers/guest.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/me", authenticate, authorize("GUEST"), getMyProfile);
router.patch("/me/dnd", authenticate, authorize("GUEST"), updateDND);

export default router;