import { Router } from "express";
import multer from "multer";
import {
  summary,
  filters,
  listStaff,
  staffOptions,
  checkPhoto,
  enroll,
  kioskSync,
  getFace,
  sampleImage,
  removeFace,
  requireFaceAdmin,
} from "../controllers/face.controller.js";

const faceRecognitionRoutes = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
});
const answerUploadError = (handler) => (req, res, next) =>
  handler(req, res, (error) => {
    if (!error) return next();
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "A photo is too large (max 5 MB)."
        : error.code === "LIMIT_UNEXPECTED_FILE" ||
            error.code === "LIMIT_FILE_COUNT"
          ? "Too many photos (max 5)."
          : "Could not read the upload.";
    return res.status(400).json({ success: false, message });
  });

faceRecognitionRoutes.get("/summary", summary);
faceRecognitionRoutes.get("/filters", filters);
faceRecognitionRoutes.get("/staff", listStaff);
faceRecognitionRoutes.get("/staff-options", staffOptions);
faceRecognitionRoutes.get("/sync", kioskSync); // kiosks: device token, not a user login

faceRecognitionRoutes.post(
  "/check",
  requireFaceAdmin,
  answerUploadError(upload.single("image")),
  checkPhoto,
);
faceRecognitionRoutes.post(
  "/enroll",
  requireFaceAdmin,
  answerUploadError(upload.array("images", 5)),
  enroll,
);

faceRecognitionRoutes.get("/:staffId", getFace);
faceRecognitionRoutes.get(
  "/:staffId/samples/:sampleId/image",
  requireFaceAdmin,
  sampleImage,
);
faceRecognitionRoutes.delete("/:staffId", requireFaceAdmin, removeFace);

export default faceRecognitionRoutes;
