import express from "express";
import { rateLimit } from "express-rate-limit";
import {
  login,
  logout,
  forgotUsername,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";

const router = express.Router();

// Rate limiter for auth endpoints (10 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: "Too many attempts, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", authLimiter, login);

router.post("/logout", authenticate, logout);

// Password / username recovery
router.post("/forgot-username", authLimiter, forgotUsername);

router.post("/forgot-password", authLimiter, forgotPassword);

router.post("/reset-password", authLimiter, resetPassword);

export default router;
