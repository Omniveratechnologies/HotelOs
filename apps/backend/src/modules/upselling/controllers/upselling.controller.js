import UpsellRule from "../models/UpsellRule.js";
import PostOrderOffer from "../models/PostOrderOffer.js";
import FastItem from "../models/FastItem.js";
import SmartRecommendationRule from "../models/SmartRecommendationRule.js";
import UpsellEvent from "../models/UpsellEvent.js";
import {
  upsellRuleDTO,
  postOrderOfferDTO,
  fastItemDTO,
  smartRuleDTO,
} from "../dto/upselling.dto.js";
import logger from "#/utils/logger.js";

function crud(Model, dto, label) {
  return {
    list: async (req, res) => {
      const rows = await Model.find({ hotelId: req.user.hotelId });
      return res.status(200).json({ success: true, data: rows.map(dto) });
    },
    create: async (req, res) => {
      const row = await Model.create({
        ...req.body,
        hotelId: req.user.hotelId,
      });
      return res
        .status(201)
        .json({ success: true, message: `${label} created`, data: dto(row) });
    },
    update: async (req, res) => {
      const row = await Model.findOneAndUpdate(
        { _id: req.params.id, hotelId: req.user.hotelId },
        { $set: req.body },
        { new: true },
      );
      if (!row)
        return res
          .status(404)
          .json({ success: false, message: `${label} not found` });
      return res.status(200).json({ success: true, data: dto(row) });
    },
    remove: async (req, res) => {
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
    },
  };
}

export const ruleCrud = crud(UpsellRule, upsellRuleDTO, "Rule");
export const offerCrud = crud(
  PostOrderOffer,
  postOrderOfferDTO,
  "Post-order offer",
);
export const fastItemCrud = crud(FastItem, fastItemDTO, "Fast item");
export const smartRuleCrud = crud(
  SmartRecommendationRule,
  smartRuleDTO,
  "Smart rule",
);

// --- Analytics ---
export const getAnalytics = async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const events = await UpsellEvent.find({
      hotelId: req.user.hotelId,
      createdAt: { $gte: since },
    });
    const count = (type) => events.filter((e) => e.eventType === type).length;
    const revenue = events
      .filter((e) => e.eventType === "accepted")
      .reduce((s, e) => s + (e.revenue || 0), 0);
    const impressions = count("impression");
    const accepted = count("accepted");
    return res.status(200).json({
      success: true,
      data: {
        impressions,
        clicks: count("click"),
        addToCart: count("addToCart"),
        accepted,
        conversionRate: impressions
          ? +((accepted / impressions) * 100).toFixed(1)
          : 0,
        revenueGenerated: revenue,
      },
    });
  } catch (error) {
    logger.error(error, "Upsell analytics error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch analytics" });
  }
};

// --- Live suggestion engine (called from Guest/Table-order apps) ---
export const suggest = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const foodItemIds = (req.query.foodItemIds || "")
      .split(",")
      .filter(Boolean);
    if (!foodItemIds.length)
      return res.status(200).json({ success: true, data: [] });

    const rules = await UpsellRule.find({
      hotelId,
      status: true,
      triggerItemId: { $in: foodItemIds },
    }).sort({ priority: 1 });

    const order = { high: 0, medium: 1, low: 2 };
    rules.sort((a, b) => order[a.priority] - order[b.priority]);

    if (rules.length) {
      await UpsellEvent.insertMany(
        rules.map((r) => ({ ruleId: r._id, eventType: "impression", hotelId })),
      );
    }

    return res
      .status(200)
      .json({ success: true, data: rules.map(upsellRuleDTO) });
  } catch (error) {
    logger.error(error, "Upsell suggest error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch suggestions" });
  }
};

export const getPostOrderOffer = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const offer = await PostOrderOffer.findOne({ hotelId, status: true }).sort({
      displayPriority: 1,
    });
    if (offer)
      await UpsellEvent.create({
        postOrderOfferId: offer._id,
        eventType: "impression",
        hotelId,
      });
    return res
      .status(200)
      .json({ success: true, data: offer ? postOrderOfferDTO(offer) : null });
  } catch (error) {
    logger.error(error, "Post-order offer error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch offer" });
  }
};

export const getFastItems = async (req, res) => {
  try {
    const items = await FastItem.find({
      hotelId: req.params.hotelId,
      status: true,
    }).sort({ displayPriority: 1 });
    return res
      .status(200)
      .json({ success: true, data: items.map(fastItemDTO) });
  } catch (error) {
    logger.error(error, "Fast items error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch fast items" });
  }
};

// --- Event tracking (called by guest-facing apps when a suggestion is clicked/added/accepted) ---
export const trackEvent = async (req, res) => {
  try {
    const { hotelId, ruleId, postOrderOfferId, eventType, revenue } = req.body;
    if (!["impression", "click", "addToCart", "accepted"].includes(eventType)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid eventType" });
    }
    await UpsellEvent.create({
      hotelId,
      ruleId: ruleId || null,
      postOrderOfferId: postOrderOfferId || null,
      eventType,
      revenue: revenue || 0,
    });
    return res.status(201).json({ success: true });
  } catch (error) {
    logger.error(error, "Track upsell event error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to track event" });
  }
};
