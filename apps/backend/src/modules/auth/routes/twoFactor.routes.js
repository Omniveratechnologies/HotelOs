import express from "express";
import {
  getTwoFactorSetupInfo,
  setupTwoFactor,
  verifyTwoFactorSetup,
  getTwoFactorStatus,
  disableTwoFactor,
  regenerateBackupCodes,
  verifyTwoFactorLogin,
} from "../controllers/twoFactor.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { validate } from "#/shared/middleware/validate.middleware.js";
import {
  setupTwoFactorBodySchema,
  verifyTwoFactorSetupBodySchema,
  disableTwoFactorBodySchema,
  regenerateBackupCodesBodySchema,
  verifyTwoFactorLoginBodySchema,
} from "../schemas/twoFactor.schemas.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// =====================================================
// 2FA SETUP INFO (public info about setup process)
// =====================================================
router.get("/setup-info", getTwoFactorSetupInfo);

// =====================================================
// 2FA STATUS
// =====================================================
router.get("/status", getTwoFactorStatus);

// =====================================================
// 2FA SETUP FLOW
// =====================================================

// Initiate 2FA setup - returns secret, QR code, backup codes
router.post(
  "/setup",
  validate({ body: setupTwoFactorBodySchema }),
  setupTwoFactor,
);

// Verify token to complete 2FA setup
router.post(
  "/setup/verify",
  validate({ body: verifyTwoFactorSetupBodySchema }),
  verifyTwoFactorSetup,
);

// =====================================================
// 2FA MANAGEMENT
// =====================================================

// Disable 2FA (requires password + token/backup code)
router.post(
  "/disable",
  validate({ body: disableTwoFactorBodySchema }),
  disableTwoFactor,
);

// Regenerate backup codes (requires password + token/backup code)
router.post(
  "/backup-codes/regenerate",
  validate({ body: regenerateBackupCodesBodySchema }),
  regenerateBackupCodes,
);

// =====================================================
// 2FA LOGIN VERIFICATION (used during login flow)
// =====================================================
router.post(
  "/verify-login",
  validate({ body: verifyTwoFactorLoginBodySchema }),
  verifyTwoFactorLogin,
);

export default router;
