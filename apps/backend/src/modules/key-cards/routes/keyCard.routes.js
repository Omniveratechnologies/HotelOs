import express from "express";
import {
  getKeyCards,
  getKeyCardStats,
  createKeyCard,
  assignKeyCard,
  reissueKeyCard,
  blockKeyCard,
  deactivateKeyCard,
  deleteKeyCard,
} from "../controllers/keyCard.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";

const router = express.Router();

router.use(authenticate, authorize("SUB_ADMIN", "RECEPTIONIST"));

router.get("/stats", getKeyCardStats);
router.get("/", getKeyCards);
router.post("/", createKeyCard);
router.post("/assign", assignKeyCard);
router.post("/:id/reissue", reissueKeyCard);
router.post("/:id/block", blockKeyCard);
router.post("/:id/deactivate", deactivateKeyCard);
router.delete("/:id", deleteKeyCard);

export default router;
