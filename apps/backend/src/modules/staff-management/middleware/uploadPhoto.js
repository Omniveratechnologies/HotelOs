import multer from "multer";
import { ApiError, getHotelId, isObjectId } from "../../../utils/http.js";
import { Staff } from "../models/staffManagement.js";
import { uploadStaffPhoto } from "../services/photoStorage.service.js";

const sendError = (res, error) => {
  if (res.headersSent) return res.end();
  const status = error.status || 500;
  if (status >= 500) console.error("Photo upload failed:", error);
  return res.status(status).json({
    success: false,
    message:
      status >= 500 ? error.message || "Photo upload failed." : error.message,
  });
};

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
    if (error?.code === "LIMIT_UNEXPECTED_FILE") {
      return sendError(
        res,
        Object.assign(
          new Error('Send the image in a form field named "photo".'),
          {
            status: 400,
          },
        ),
      );
    }
    if (error?.name === "MulterError") {
      return sendError(res, Object.assign(error, { status: 400 }));
    }
    return error ? sendError(res, error) : next();
  });

export const uploadPhotoToR2 = async (req, res, next) => {
  try {
    if (!req.file)
      throw new ApiError(400, "Choose a photo to upload (field name: photo).");
    if (!isObjectId(req.params.id))
      throw new ApiError(400, "Invalid staff ID.");

    const hotelId = getHotelId(req);
    const staff = await Staff.findOne({
      _id: req.params.id,
      hotelId,
      deletedAt: null,
    }).select("photoUrl");
    if (!staff) throw new ApiError(404, "Staff not found.");

    const photo = await uploadStaffPhoto({
      buffer: req.file.buffer,
      hotelId,
      staffId: staff._id,
    });

    req.file.buffer = undefined;
    req.photoUpload = { staff, photo };
  } catch (error) {
    return sendError(res, error);
  }
  return next();
};
