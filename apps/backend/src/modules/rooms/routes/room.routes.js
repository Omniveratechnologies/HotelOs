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
import { validate } from "#/shared/middleware/validate.middleware.js";
import {
  createRoomBodySchema,
  updateRoomBodySchema,
  checkOutRoomBodySchema,
  roomIdParamsSchema,
  getRoomsQuerySchema,
} from "../schemas.js";

const router = express.Router();

router.use(authenticate, authorize("SUPER_ADMIN", "SUB_ADMIN", "RECEPTIONIST"));

router.get("/", validate({ query: getRoomsQuerySchema }), getRooms);

router.get("/:id", validate({ params: roomIdParamsSchema }), getRoomById);

router.post("/", validate({ body: createRoomBodySchema }), createRoom);

router.patch(
  "/:id",
  validate({ params: roomIdParamsSchema, body: updateRoomBodySchema }),
  updateRoom,
);

router.post(
  "/:id/check-out",
  validate({ params: roomIdParamsSchema, body: checkOutRoomBodySchema }),
  checkOutRoom,
);

router.delete("/:id", validate({ params: roomIdParamsSchema }), deleteRoom);

export default router;
