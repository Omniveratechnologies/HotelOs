import { Router } from "express";
import {
  getGuests,
  searchGuests,
  getGuestById,
  updateGuest,
  deleteGuest,
  restoreGuest,
  getDocumentUploadUrls,
  updateGuestCredentials,
  deleteGuestDocument,
  getMyProfile,
  updateDND,
} from "../controllers/guest.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";
import { validate } from "#/shared/middleware/validate.middleware.js";
import {
  updateGuestBodySchema,
  updateGuestCredentialsBodySchema,
  updateDNDBodySchema,
  getDocumentUploadUrlsBodySchema,
  searchGuestsQuerySchema,
  getGuestsQuerySchema,
  guestIdParamsSchema,
  guestDocumentParamsSchema,
} from "../schemas.js";

const router = Router();

// Guest self-service endpoints (role GUEST). Declared before the admin guard
// below because they do NOT share the SUB_ADMIN/RECEPTIONIST restriction.
router.get("/me", authenticate, authorize("GUEST"), getMyProfile);
router.patch(
  "/me/dnd",
  authenticate,
  authorize("GUEST"),
  validate({ body: updateDNDBodySchema }),
  updateDND,
);

// Admin-scoped guest profile management
router.use(authenticate, authorize("SUB_ADMIN", "RECEPTIONIST"));

router.get("/", validate({ query: getGuestsQuerySchema }), getGuests);

router.get(
  "/search",
  validate({ query: searchGuestsQuerySchema }),
  searchGuests,
);

router.post(
  "/documents/upload-urls",
  validate({ body: getDocumentUploadUrlsBodySchema }),
  getDocumentUploadUrls,
);

router.get("/:id", validate({ params: guestIdParamsSchema }), getGuestById);

router.patch(
  "/:id",
  validate({ params: guestIdParamsSchema, body: updateGuestBodySchema }),
  updateGuest,
);

router.patch(
  "/:id/credentials",
  validate({
    params: guestIdParamsSchema,
    body: updateGuestCredentialsBodySchema,
  }),
  updateGuestCredentials,
);

router.delete("/:id", validate({ params: guestIdParamsSchema }), deleteGuest);

router.patch(
  "/:id/restore",
  validate({ params: guestIdParamsSchema }),
  restoreGuest,
);

router.delete(
  "/:guestId/documents/:docId",
  validate({ params: guestDocumentParamsSchema }),
  deleteGuestDocument,
);

export default router;
