import express from "express";
import {
  ruleCrud,
  offerCrud,
  fastItemCrud,
  smartRuleCrud,
  getAnalytics,
  suggest,
  getPostOrderOffer,
  getFastItems,
  trackEvent,
} from "../controllers/upselling.controller.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";

const router = express.Router();

// Public — called by Guest Dashboard / Table-Order app (no login there)
router.get("/public/:hotelId/suggest", suggest);
router.get("/public/:hotelId/post-order-offer", getPostOrderOffer);
router.get("/public/:hotelId/fast-items", getFastItems);
router.post("/public/track", trackEvent);

// Staff-managed
router.use(authenticate, authorize("SUB_ADMIN", "RECEPTIONIST", "KITCHEN"));
router.get("/analytics", getAnalytics);

router.get("/rules", ruleCrud.list);
router.post("/rules", ruleCrud.create);
router.patch("/rules/:id", ruleCrud.update);
router.delete("/rules/:id", ruleCrud.remove);

router.get("/post-order-offers", offerCrud.list);
router.post("/post-order-offers", offerCrud.create);
router.patch("/post-order-offers/:id", offerCrud.update);
router.delete("/post-order-offers/:id", offerCrud.remove);

router.get("/fast-items", fastItemCrud.list);
router.post("/fast-items", fastItemCrud.create);
router.patch("/fast-items/:id", fastItemCrud.update);
router.delete("/fast-items/:id", fastItemCrud.remove);

router.get("/smart-rules", smartRuleCrud.list);
router.post("/smart-rules", smartRuleCrud.create);
router.patch("/smart-rules/:id", smartRuleCrud.update);
router.delete("/smart-rules/:id", smartRuleCrud.remove);

export default router;
