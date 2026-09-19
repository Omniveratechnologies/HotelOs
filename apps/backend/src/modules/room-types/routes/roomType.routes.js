import express from "express";

import {
  getRoomTypes,
  createRoomType,
  updateRoomType,
  deleteRoomType,
} from "../controllers/roomType.controller.js";

import { authenticate } from "#/shared/middleware/auth.middleware.js";

import { authorize } from "#/shared/middleware/role.middleware.js";

const router = express.Router();

// Read + manage — SUB_ADMIN + RECEPTIONIST
router.use(authenticate, authorize("SUB_ADMIN", "RECEPTIONIST"));

router.get("/", getRoomTypes);
router.post("/", createRoomType);
router.patch("/:id", updateRoomType);
router.delete("/:id", deleteRoomType);

export default router;
