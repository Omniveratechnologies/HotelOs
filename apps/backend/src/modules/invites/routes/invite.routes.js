import express from "express";

import {
  sendInvite,
  verifyInvite,
  acceptInvite,
} from "../controllers/invite.controller.js";

import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { validate } from "#/shared/middleware/validate.middleware.js";
import {
  sendInviteBodySchema,
  verifyInviteBodySchema,
  acceptInviteBodySchema,
} from "../schemas.js";

const router = express.Router();

// =====================================================
// VERIFY INVITATION
// PUBLIC
// =====================================================

router.post(
  "/verify",
  validate({ body: verifyInviteBodySchema }),
  verifyInvite,
);

// =====================================================
// ACCEPT INVITATION + CREATE ACCOUNT
// PUBLIC
// =====================================================

router.post(
  "/accept",
  validate({ body: acceptInviteBodySchema }),
  acceptInvite,
);

// =====================================================
// SEND INVITATION
// AUTHENTICATED
// =====================================================

router.post(
  "/",
  authenticate,
  validate({ body: sendInviteBodySchema }),
  sendInvite,
);

export default router;
