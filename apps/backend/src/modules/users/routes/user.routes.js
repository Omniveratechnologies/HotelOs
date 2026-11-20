import express from "express";
import {
  createUser,
  getUsers,
  deleteUser,
} from "../controllers/user.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";
import { validate } from "#/shared/middleware/validate.middleware.js";
import {
  createUserBodySchema,
  getUsersQuerySchema,
  userIdParamsSchema,
} from "../schemas.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "SUB_ADMIN"),
  validate({ body: createUserBodySchema }),
  createUser,
);

router.get(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "SUB_ADMIN", "RECEPTIONIST"),
  validate({ query: getUsersQuerySchema }),
  getUsers,
);

router.delete(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN", "SUB_ADMIN"),
  validate({ params: userIdParamsSchema }),
  deleteUser,
);

export default router;
