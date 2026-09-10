import express from "express";
import {
  createUser,
  getUsers,
  deleteUser,
} from "../controllers/user.controller.js";
import { authenticate } from "#src/shared/middleware/auth.middleware.js";
import { authorize } from "#src/shared/middleware/role.middleware.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "SUB_ADMIN"),
  createUser,
);

router.get(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "SUB_ADMIN", "RECEPTIONIST"),
  getUsers,
);

router.delete(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN", "SUB_ADMIN"),
  deleteUser,
);

export default router;
