import multer from "multer";
import { sendError } from "../utils/http.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      const error = new Error("Photo must be a JPG, PNG or WEBP image.");
      error.status = 400;
      return cb(error);
    }
    return cb(null, true);
  },
});

export const uploadPhotoFile = (req, res, next) =>
  upload.single("photo")(req, res, (error) => {
    if (error?.code === "LIMIT_FILE_SIZE") {
      return sendError(
        res,
        Object.assign(new Error("Photo must be 2 MB or smaller."), {
          status: 400,
        }),
      );
    }
    return error ? sendError(res, error) : next();
  });
