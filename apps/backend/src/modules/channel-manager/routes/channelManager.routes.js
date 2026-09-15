import express from "express";

import { handleWebhook } from "../controllers/channelManager.controller.js";
import { validateBasicAuth } from "../middleware/basicAuth.middleware.js";

const router = express.Router();

// Aiosell webhook endpoint — Basic Auth only, no JWT.
router.post("/webhook", validateBasicAuth, handleWebhook);

export default router;
