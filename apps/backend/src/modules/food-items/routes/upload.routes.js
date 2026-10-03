import express from "express";

import { getUploadUrl } from "../controllers/upload.controller.js";

import { authenticate } from "#/shared/middleware/auth.middleware.js";

const router = express.Router();

router.post("/presigned-url", authenticate, getUploadUrl);

export default router;
