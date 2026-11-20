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
import { validate } from "#/shared/middleware/validate.middleware.js";
import {
  createKeyCardBodySchema,
  getKeyCardsQuerySchema,
  assignKeyCardBodySchema,
  reissueKeyCardBodySchema,
  blockKeyCardBodySchema,
  deactivateKeyCardBodySchema,
  keyCardIdParamsSchema,
} from "../schemas.js";

const router = express.Router();

router.use(authenticate, authorize("SUB_ADMIN", "RECEPTIONIST"));

router.get("/stats", getKeyCardStats);
router.get("/", validate({ query: getKeyCardsQuerySchema }), getKeyCards);
router.post("/", validate({ body: createKeyCardBodySchema }), createKeyCard);
router.post(
  "/assign",
  validate({ body: assignKeyCardBodySchema }),
  assignKeyCard,
);
router.post(
  "/:id/reissue",
  validate({ params: keyCardIdParamsSchema, body: reissueKeyCardBodySchema }),
  reissueKeyCard,
);
router.post(
  "/:id/block",
  validate({ params: keyCardIdParamsSchema, body: blockKeyCardBodySchema }),
  blockKeyCard,
);
router.post(
  "/:id/deactivate",
  validate({
    params: keyCardIdParamsSchema,
    body: deactivateKeyCardBodySchema,
  }),
  deactivateKeyCard,
);
router.delete(
  "/:id",
  validate({ params: keyCardIdParamsSchema }),
  deleteKeyCard,
);

export default router;
