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
} from "../controllers/guest.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

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
