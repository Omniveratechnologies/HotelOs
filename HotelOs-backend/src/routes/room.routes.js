import express from "express";
import {
    getRooms,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom
  } from "../controllers/room.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(authenticate, authorize("SUB_ADMIN", "RECEPTIONIST"));

router.get("/", getRooms);

router.get("/:id", getRoomById);

router.post("/", createRoom);

router.patch("/:id", updateRoom);

router.delete("/:id", deleteRoom);

export default router;
