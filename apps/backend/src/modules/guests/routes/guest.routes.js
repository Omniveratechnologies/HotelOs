import { Router } from "express";
import {
  getGuests,
  getGuestById,
  updateGuest,
  getDocumentUploadUrls,
  updateGuestCredentials,
  deleteGuestDocument,
  getMyProfile,
  updateDND,
} from "../controllers/guest.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";

const router = Router();

// Guest self-service endpoints (role GUEST). Declared before the admin guard
// below because they do NOT share the SUB_ADMIN/RECEPTIONIST restriction.
router.get("/me", authenticate, authorize("GUEST"), getMyProfile);
router.patch("/me/dnd", authenticate, authorize("GUEST"), updateDND);

// Admin-scoped guest profile management
router.use(authenticate, authorize("SUB_ADMIN", "RECEPTIONIST"));

router.get("/", getGuests);

router.post("/documents/upload-urls", getDocumentUploadUrls);

router.get("/:id", getGuestById);

router.patch("/:id", updateGuest);

router.patch("/:id/credentials", updateGuestCredentials);

router.delete("/:guestId/documents/:docId", deleteGuestDocument);

export default router;
