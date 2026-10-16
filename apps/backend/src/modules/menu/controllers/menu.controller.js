import Category from "../models/Category.js";
import ModifierGroup from "../models/ModifierGroup.js";
import Discount from "../models/Discount.js";
import PricingRule from "../models/PricingRule.js";
import { categoryDTO } from "../dto/category.dto.js";
import { modifierGroupDTO } from "../dto/modifierGroup.dto.js";
import { discountDTO } from "../dto/discount.dto.js";
import { pricingRuleDTO } from "../dto/pricingRule.dto.js";
import logger from "#/utils/logger.js";

// Mongoose ValidationError / CastError mean the request itself was bad
// (missing required field, invalid ObjectId, etc). Surface those as a 400
// with the real message instead of swallowing them into a generic 500 —
// that generic message is what made the parentCategory bug so hard to spot.
function isClientError(error) {
  return error?.name === "ValidationError" || error?.name === "CastError";
}

function makeCrud(Model, dto, label) {
  return {
    list: async (req, res) => {
      try {
        const rows = await Model.find({ hotelId: req.user.hotelId }).sort({
          displayOrder: 1,
          createdAt: 1,
        });
        return res.status(200).json({ success: true, data: rows.map(dto) });
      } catch (error) {
        logger.error(error, `List ${label} error`);
        return res
          .status(500)
          .json({ success: false, message: `Failed to fetch ${label}` });
      }
    },
    create: async (req, res) => {
      try {
        const row = await Model.create({
          ...req.body,
          hotelId: req.user.hotelId,
        });
        return res
          .status(201)
          .json({ success: true, message: `${label} created`, data: dto(row) });
      } catch (error) {
        logger.error(error, `Create ${label} error`);
        if (isClientError(error)) {
          return res
            .status(400)
            .json({ success: false, message: error.message });
        }
        return res
          .status(500)
          .json({ success: false, message: `Failed to create ${label}` });
      }
    },
    update: async (req, res) => {
      try {
        const row = await Model.findOneAndUpdate(
          { _id: req.params.id, hotelId: req.user.hotelId },
          { $set: req.body },
          { new: true, runValidators: true },
        );
        if (!row)
          return res
            .status(404)
            .json({ success: false, message: `${label} not found` });
        return res.status(200).json({ success: true, data: dto(row) });
      } catch (error) {
        logger.error(error, `Update ${label} error`);
        if (isClientError(error)) {
          return res
            .status(400)
            .json({ success: false, message: error.message });
        }
        return res
          .status(500)
          .json({ success: false, message: `Failed to update ${label}` });
      }
    },
    remove: async (req, res) => {
      try {
        const row = await Model.findOneAndDelete({
          _id: req.params.id,
          hotelId: req.user.hotelId,
        });
        if (!row)
          return res
            .status(404)
            .json({ success: false, message: `${label} not found` });
        return res
          .status(200)
          .json({ success: true, message: `${label} deleted` });
      } catch (error) {
        logger.error(error, `Delete ${label} error`);
        return res
          .status(500)
          .json({ success: false, message: `Failed to delete ${label}` });
      }
    },
  };
}

export const categoryCrud = makeCrud(Category, categoryDTO, "Category");
export const modifierGroupCrud = makeCrud(
  ModifierGroup,
  modifierGroupDTO,
  "Modifier group",
);
export const discountCrud = makeCrud(Discount, discountDTO, "Discount");
export const pricingRuleCrud = makeCrud(
  PricingRule,
  pricingRuleDTO,
  "Pricing rule",
);
