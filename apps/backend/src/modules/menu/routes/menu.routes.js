import express from "express";
import {
  categoryCrud,
  modifierGroupCrud,
  discountCrud,
  pricingRuleCrud,
} from "../controllers/menu.controller.js";
import Discount from "../models/Discount.js";
import { discountDTO } from "../dto/discount.dto.js";
import { authenticate } from "#/shared/middleware/auth.middleware.js";
import { authorize } from "#/shared/middleware/role.middleware.js";

const router = express.Router();
router.use(authenticate, authorize("SUB_ADMIN", "KITCHEN", "RECEPTIONIST"));

router.get("/categories", categoryCrud.list);
router.post("/categories", categoryCrud.create);
router.patch("/categories/:id", categoryCrud.update);
router.delete("/categories/:id", categoryCrud.remove);

router.get("/modifier-groups", modifierGroupCrud.list);
router.post("/modifier-groups", modifierGroupCrud.create);
router.patch("/modifier-groups/:id", modifierGroupCrud.update);
router.delete("/modifier-groups/:id", modifierGroupCrud.remove);

router.get("/discounts", discountCrud.list);
router.post("/discounts", discountCrud.create);
router.patch("/discounts/:id", discountCrud.update);
router.delete("/discounts/:id", discountCrud.remove);

router.get("/pricing-rules", pricingRuleCrud.list);
router.post("/pricing-rules", pricingRuleCrud.create);
router.patch("/pricing-rules/:id", pricingRuleCrud.update);
router.delete("/pricing-rules/:id", pricingRuleCrud.remove);
const getPublicDiscounts = async (req, res) => {
  try {
    const discounts = await Discount.find({
      hotelId: req.params.hotelId,
      status: true,
    });
    return res
      .status(200)
      .json({ success: true, data: discounts.map(discountDTO) });
  } catch {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch offers" });
  }
};

router.get("/discounts/public/:hotelId", (req, res, next) =>
  Promise.resolve(getPublicDiscounts(req, res, next)).catch(next),
);

export default router;
