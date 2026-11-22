import express from "express";

import {
  getRoomTypes,
  createRoomType,
  updateRoomType,
  deleteRoomType,
} from "../controllers/roomType.controller.js";

import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";
import { validate } from "#/shared/middleware/validate.middleware.js";
import {
  createRoomTypeBodySchema,
  updateRoomTypeBodySchema,
  roomTypeIdParamsSchema,
} from "../schemas.js";

const router = express.Router();

// Read + manage — SUB_ADMIN + RECEPTIONIST
router.use(authenticate, authorize("SUB_ADMIN", "RECEPTIONIST"));

router.get("/", getRoomTypes);
router.post("/", validate({ body: createRoomTypeBodySchema }), createRoomType);
router.patch(
  "/:id",
  validate({ params: roomTypeIdParamsSchema, body: updateRoomTypeBodySchema }),
  updateRoomType,
);
router.delete(
  "/:id",
  validate({ params: roomTypeIdParamsSchema }),
  deleteRoomType,
);

export default router;
