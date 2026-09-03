import express from "express";
import {
  registerGuest,
  getGuests,
  getGuestById,
  updateGuest,
  getDocumentUploadUrls,
  updateGuestCredentials,
  deleteGuestDocument,
  deleteGuest,
  getMyProfile,
  updateDND,
} from "../controllers/guest.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";

const router = express.Router();

// Guest self-service endpoints (role GUEST). Declared before the admin guard
// below because they do NOT share the SUB_ADMIN/RECEPTIONIST restriction.
router.get("/me", authenticate, authorize("GUEST"), getMyProfile);
router.patch("/me/dnd", authenticate, authorize("GUEST"), updateDND);

// Admin-scoped guest management
router.use(authenticate, authorize("SUB_ADMIN", "RECEPTIONIST"));

router.get("/", getGuests);

router.post("/documents/upload-urls", getDocumentUploadUrls);

router.post("/", registerGuest);

router.get("/:id", getGuestById);

router.patch("/:id", updateGuest);

router.patch("/:id/credentials", updateGuestCredentials);

router.delete("/:guestId/documents/:docId", deleteGuestDocument);

router.delete("/:id", deleteGuest);

export default router;
