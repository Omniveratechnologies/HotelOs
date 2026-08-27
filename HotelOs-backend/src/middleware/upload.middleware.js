import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads", "guests");

// Allowed document file types
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf"
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const MAX_FILES = 5;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Files are stored per hotel: uploads/guests/<hotelId>/
    const hotelDir = path.join(UPLOAD_ROOT, String(req.user.hotelId));

    fs.mkdir(hotelDir, { recursive: true }, (err) => {
      if (err) {
        return cb(err);
      }

      cb(null, hotelDir);
    });
  },

  filename: (req, file, cb) => {
    // Random name to avoid collisions and path traversal issues
    const unique =
      `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;

    const ext = path.extname(file.originalname).toLowerCase();

    cb(null, `${unique}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new Error("Only JPG, PNG, WEBP and PDF documents are allowed")
    );
  }

  cb(null, true);
};

export const uploadGuestDocuments = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES
  }
}).array("documents", MAX_FILES);

// Multer errors arrive as plain Error instances; map the common ones
export function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Each document must be 5 MB or smaller"
      });
    }

    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: `A maximum of ${MAX_FILES} documents can be uploaded at once`
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message || "Document upload failed"
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "Document upload failed"
    });
  }

  next();
}
