import express from "express";
import { rateLimit } from "express-rate-limit";
import {
  login,
  logout,
  forgotUsername,
  forgotPassword,
  resetPassword,
  changePassword,
} from "../controllers/auth.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { validate } from "#/shared/middleware/validate.middleware.js";
import {
  loginBodySchema,
  forgotUsernameBodySchema,
  forgotPasswordBodySchema,
  resetPasswordBodySchema,
  changePasswordBodySchema,
} from "../schemas.js";

const router = express.Router();

// Rate limiter for auth endpoints (10 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: "Too many attempts, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for login (5 requests per 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many login attempts, try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", loginLimiter, validate({ body: loginBodySchema }), login);

router.post("/logout", authenticate, logout);

// Password / username recovery
router.post(
  "/forgot-username",
  authLimiter,
  validate({ body: forgotUsernameBodySchema }),
  forgotUsername,
);

router.post(
  "/forgot-password",
  authLimiter,
  validate({ body: forgotPasswordBodySchema }),
  forgotPassword,
);

router.post(
  "/reset-password",
  authLimiter,
  validate({ body: resetPasswordBodySchema }),
  resetPassword,
);

// Change password (authenticated)
router.post(
  "/change-password",
  authenticate,
  validate({ body: changePasswordBodySchema }),
  changePassword,
);

export default router;
