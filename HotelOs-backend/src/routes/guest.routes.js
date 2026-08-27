import express from "express";
import {
    registerGuest,
    getGuests,
    getGuestById,
    updateGuest,
    updateGuestCredentials,
    deleteGuestDocument,
    deleteGuest
  } from "../controllers/guest.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import {
  uploadGuestDocuments,
  handleUploadError
} from "../middleware/upload.middleware.js";

const router = express.Router();

router.use(authenticate, authorize("SUB_ADMIN", "RECEPTIONIST"));

router.get("/", getGuests);

router.post("/", uploadGuestDocuments, handleUploadError, registerGuest);

router.get("/:id", getGuestById);

router.patch(
  "/:id",
  uploadGuestDocuments,
  handleUploadError,
  updateGuest
);

router.patch("/:id/credentials", updateGuestCredentials);

router.delete("/:guestId/documents/:docId", deleteGuestDocument);

router.delete("/:id", deleteGuest);

export default router;
