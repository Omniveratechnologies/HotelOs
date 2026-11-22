import express from "express";
import {
  createUser,
  getUsers,
  updateUser,
  resetUserPassword,
  deleteUser,
  restoreUser,
} from "../controllers/user.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";
import { validate } from "#/shared/middleware/validate.middleware.js";
import {
  createUserBodySchema,
  updateUserBodySchema,
  resetUserPasswordBodySchema,
  restoreUserBodySchema,
  getUsersQuerySchema,
  deleteUserQuerySchema,
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

router.put(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN", "SUB_ADMIN"),
  validate({ params: userIdParamsSchema, body: updateUserBodySchema }),
  updateUser,
);

router.post(
  "/:id/reset-password",
  authenticate,
  authorize("SUPER_ADMIN", "SUB_ADMIN"),
  validate({ params: userIdParamsSchema, body: resetUserPasswordBodySchema }),
  resetUserPassword,
);

router.post(
  "/:id/restore",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate({ params: userIdParamsSchema, body: restoreUserBodySchema }),
  restoreUser,
);

router.delete(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN", "SUB_ADMIN"),
  validate({ params: userIdParamsSchema, query: deleteUserQuerySchema }),
  deleteUser,
);

export default router;
