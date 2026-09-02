import express from "express";
import {
    createUser,
    getUsers
  } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "SUB_ADMIN"),
  createUser
);

router.get(
    "/",
    authenticate,
    authorize("SUPER_ADMIN", "SUB_ADMIN"),
    getUsers
  );

export default router;