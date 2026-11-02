import path from "node:path";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== ".csv") {
      const error = new Error("Only .csv files are allowed.");
      error.status = 400;
      return cb(error);
    }
    return cb(null, true);
  },
});

export const uploadImportFile = (req, res, next) =>
  upload.single("file")(req, res, (error) => {
    if (!error) return next();

    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "File is too large (max 5 MB)."
        : error.message;

    return res.status(error.status || 400).json({ success: false, message });
  });
