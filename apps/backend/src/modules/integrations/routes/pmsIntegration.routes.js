import express from "express";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";
import {
  lookupCurrentGuest,
  postFolioCharge,
  reverseFolioCharge,
} from "../controllers/pmsIntegration.controller.js";

const router = express.Router();
router.use(authenticate, authorize("SUB_ADMIN", "RECEPTIONIST", "KITCHEN"));
router.get("/rooms/:roomNumber/current-guest", lookupCurrentGuest);
router.post("/folio-charges", postFolioCharge);
router.post("/folio-charges/:id/reverse", reverseFolioCharge);

export default router;
