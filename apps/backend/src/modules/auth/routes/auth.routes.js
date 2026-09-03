import express from "express";
import {
  login,
  logout,
  forgotUsername,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import { authenticate } from "../../../shared/middleware/auth.middleware.js";

const router = express.Router();

router.post("/login", login);

router.post("/logout", authenticate, logout);

// Password / username recovery
router.post("/forgot-username", forgotUsername);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

export default router;
