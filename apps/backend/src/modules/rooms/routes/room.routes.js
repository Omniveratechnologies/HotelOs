import express from "express";
import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  checkOutRoom,
} from "../controllers/room.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";

const router = express.Router();

router.use(authenticate, authorize("SUPER_ADMIN", "SUB_ADMIN", "RECEPTIONIST"));

router.get("/", getRooms);

router.get("/:id", getRoomById);

router.post("/", createRoom);

router.patch("/:id", updateRoom);

router.post("/:id/check-out", checkOutRoom);

router.delete("/:id", deleteRoom);

export default router;
