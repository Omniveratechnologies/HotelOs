import mongoose from "mongoose";
import { defaultHotelId } from "./defaultHotel.js";

export class ApiError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export const isObjectId = (value) =>
  /^[0-9a-fA-F]{24}$/.test(String(value ?? ""));

export const toObjectId = (value) => new mongoose.Types.ObjectId(String(value));

export const getHotelId = (req) => {
  const id = req.user?.hotelId || req.user?.hotel?._id || defaultHotelId();

  if (!isObjectId(id)) {
    throw new ApiError(
      400,
      "Hotel context missing; auth middleware must set req.user.hotelId.",
    );
  }
  return toObjectId(id);
};

export const sendError = (res, error) => {
  if (res.headersSent) {
    res.end();
    return;
  }

  let status = error.status || 500;
  let message = error.message;
  let errors = Array.isArray(error.errors) ? error.errors : undefined;

  if (
    error.name === "ValidationError" &&
    error.errors &&
    !Array.isArray(error.errors)
  ) {
    status = 400;
    message = "Validation failed";
    errors = Object.values(error.errors).map((item) => item.message);
  } else if (error.name === "CastError") {
    status = 400;
    message = `Invalid ${error.path}`;
  } else if (error.name === "MulterError") {
    status = 400;
    message =
      error.code === "LIMIT_FILE_SIZE"
        ? "File is too large (max 5 MB)."
        : error.message;
  } else if (error.code === 11000) {
    status = 409;
    message = "Staff code or phone already exists for this hotel.";
  }

  if (status >= 500) {
    console.error("Staff management error:", error);
    message = "Staff request failed.";
    errors = undefined;
  }

  res
    .status(status)
    .json({ success: false, message, ...(errors?.length ? { errors } : {}) });
};

export const route = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    sendError(res, error);
  }
};

export const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
