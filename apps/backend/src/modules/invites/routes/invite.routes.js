import express from "express";

import {
  sendInvite,
  verifyInvite,
  acceptInvite,
} from "../controllers/invite.controller.js";

import { authenticate } from "#/shared/middleware/auth.middleware.js";

const router = express.Router();

// =====================================================
// VERIFY INVITATION
// PUBLIC
// =====================================================

router.post("/verify", verifyInvite);

// =====================================================
// ACCEPT INVITATION + CREATE ACCOUNT
// PUBLIC
// =====================================================

router.post("/accept", acceptInvite);

// =====================================================
// SEND INVITATION
// AUTHENTICATED
// =====================================================

router.post("/", authenticate, sendInvite);

export default router;
