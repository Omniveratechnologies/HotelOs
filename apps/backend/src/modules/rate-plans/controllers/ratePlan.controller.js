// Rate plan CRUD + manual rate sync to Aiosell. Rate changes re-push via
// aiosellSyncRates as a non-blocking side effect (same pattern as inventory).
import RatePlan from "../models/RatePlan.js";
import { ratePlanDTO } from "../dto/ratePlan.dto.js";
import { aiosellSyncRates } from "#/shared/services/inventory.service.js";
import {
  KIND_ROOM,
  KIND_RATE_PLAN,
  resolveChannelStatus,
} from "#/modules/channel-manager/services/approval.service.js";

import logger from "#/utils/logger.js";

// =====================================================
// GET ALL RATE PLANS (hotel-scoped)
// =====================================================

export const getRatePlans = async (req, res) => {
  try {
    const ratePlans = await RatePlan.find({
      hotelId: req.user.hotelId,
    }).sort({ ratePlanCode: 1 });

    return res.status(200).json({
      success: true,
      message: "Rate plans fetched successfully",
      data: ratePlans.map(ratePlanDTO),
    });
  } catch (error) {
    logger.error(error, "Get Rate Plans Error");

    return res.status(500).json({
      success: false,
      message: "Failed to fetch rate plans",
    });
  }
};

// =====================================================
// CREATE RATE PLAN
// =====================================================

export const createRatePlan = async (req, res) => {
  try {
    const {
      name,
      ratePlanCode,
      roomCode,
      roomType,
      rate,
      occupancy,
      mealPlan,
    } = req.body;

    if (
      !name?.trim() ||
      !ratePlanCode?.trim() ||
      !roomCode?.trim() ||
      !roomType ||
      rate === undefined ||
      rate === null ||
      !occupancy
    ) {
      return res.status(400).json({
        success: false,
        message:
          "name, ratePlanCode, roomCode, roomType, rate and occupancy are required",
      });
    }

    if (typeof rate !== "number" || rate < 0) {
      return res.status(400).json({
        success: false,
        message: "Rate must be a positive number",
      });
    }

    const code = ratePlanCode.trim().toLowerCase();
    const roomCodeValue = roomCode.trim().toLowerCase();
    // A rate plan can only be pushed once BOTH its room type and its own
    // ratePlanCode exist in Aiosell (both are created manually + approved).
    const codeStatus = await resolveChannelStatus(
      req.user.hotelId,
      KIND_RATE_PLAN,
      code,
    );
    const roomStatus = await resolveChannelStatus(
      req.user.hotelId,
      KIND_ROOM,
      roomCodeValue,
    );
    const channelSyncStatus =
      codeStatus === "completed" && roomStatus === "completed"
        ? "completed"
        : "under_review";

    const ratePlan = await RatePlan.create({
      name: name.trim(),
      ratePlanCode: code,
      roomCode: roomCodeValue,
      roomType,
      rate,
      occupancy,
      mealPlan: mealPlan || "EP",
      channelSyncStatus,
      hotelId: req.user.hotelId,
    });

    // =================================================
    // SYNC RATES TO AIOSELL (non-critical side effect)
    // Only approved rate plans sync — see ChannelApproval.
    // =================================================

    if (ratePlan.channelSyncStatus === "completed") {
      try {
        await aiosellSyncRates(req.user.hotelId);
      } catch (syncError) {
        logger.error(syncError, "Rate sync after rate plan creation failed");
      }
    }

    return res.status(201).json({
      success: true,
      message: "Rate plan created successfully",
      data: ratePlanDTO(ratePlan),
    });
  } catch (error) {
    logger.error(error, "Create Rate Plan Error");

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A rate plan with this code already exists in your hotel",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create rate plan",
    });
  }
};

// =====================================================
// UPDATE RATE PLAN
// =====================================================

export const updateRatePlan = async (req, res) => {
  try {
    const allowedUpdates = {};
    let mappingChanged = false;

    const {
      name,
      ratePlanCode,
      roomCode,
      roomType,
      rate,
      occupancy,
      mealPlan,
      isActive,
    } = req.body;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }
      allowedUpdates.name = name.trim();
    }

    if (ratePlanCode !== undefined) {
      if (!ratePlanCode.trim()) {
        return res.status(400).json({
          success: false,
          message: "Rate plan code cannot be empty",
        });
      }
      allowedUpdates.ratePlanCode = ratePlanCode.trim().toLowerCase();
      mappingChanged = true;
    }

    if (roomCode !== undefined) {
      allowedUpdates.roomCode = roomCode.trim().toLowerCase();
      mappingChanged = true;
    }

    if (roomType !== undefined) {
      allowedUpdates.roomType = roomType;
    }

    if (rate !== undefined) {
      if (typeof rate !== "number" || rate < 0) {
        return res.status(400).json({
          success: false,
          message: "Rate must be a positive number",
        });
      }
      allowedUpdates.rate = rate;
    }

    if (occupancy !== undefined) {
      allowedUpdates.occupancy = occupancy;
    }

    if (mealPlan !== undefined) {
      allowedUpdates.mealPlan = mealPlan;
    }

    if (isActive !== undefined) {
      allowedUpdates.isActive = Boolean(isActive);
    }

    // Recompute review status when the Aiosell mapping (ratePlanCode or
    // roomCode) changed — push is only possible once both exist in Aiosell.
    if (mappingChanged) {
      const existingRatePlan = await RatePlan.findOne({
        _id: req.params.id,
        hotelId: req.user.hotelId,
      });
      const finalCode =
        allowedUpdates.ratePlanCode ?? existingRatePlan.ratePlanCode;
      const finalRoomCode =
        allowedUpdates.roomCode ?? existingRatePlan.roomCode;
      const codeStatus = await resolveChannelStatus(
        req.user.hotelId,
        KIND_RATE_PLAN,
        finalCode,
      );
      const roomStatus = await resolveChannelStatus(
        req.user.hotelId,
        KIND_ROOM,
        finalRoomCode,
      );
      allowedUpdates.channelSyncStatus =
        codeStatus === "completed" && roomStatus === "completed"
          ? "completed"
          : "under_review";
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    const ratePlan = await RatePlan.findOneAndUpdate(
      {
        _id: req.params.id,
        hotelId: req.user.hotelId,
      },
      allowedUpdates,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!ratePlan) {
      return res.status(404).json({
        success: false,
        message: "Rate plan not found",
      });
    }

    // =================================================
    // SYNC RATES TO AIOSELL (non-critical side effect)
    // Only when the mapping changed AND ended approved.
    // =================================================

    if (mappingChanged && ratePlan.channelSyncStatus === "completed") {
      try {
        await aiosellSyncRates(req.user.hotelId);
      } catch (syncError) {
        logger.error(syncError, "Rate sync after rate plan update failed");
      }
    }

    return res.status(200).json({
      success: true,
      message: "Rate plan updated successfully",
      data: ratePlanDTO(ratePlan),
    });
  } catch (error) {
    logger.error(error, "Update Rate Plan Error");

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A rate plan with this code already exists in your hotel",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update rate plan",
    });
  }
};

// =====================================================
// DELETE RATE PLAN
// =====================================================

export const deleteRatePlan = async (req, res) => {
  try {
    const ratePlan = await RatePlan.findOneAndDelete({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    });

    if (!ratePlan) {
      return res.status(404).json({
        success: false,
        message: "Rate plan not found",
      });
    }

    // =================================================
    // SYNC RATES TO AIOSELL (non-critical side effect)
    // =================================================

    try {
      await aiosellSyncRates(req.user.hotelId);
    } catch (syncError) {
      logger.error(syncError, "Rate sync after rate plan deletion failed");
    }

    return res.status(200).json({
      success: true,
      message: "Rate plan deleted successfully",
    });
  } catch (error) {
    logger.error(error, "Delete Rate Plan Error");

    return res.status(500).json({
      success: false,
      message: "Failed to delete rate plan",
    });
  }
};

// =====================================================
// SYNC ALL RATES TO AIOSELL (manual trigger)
// =====================================================

export const syncAllRates = async (req, res) => {
  try {
    const result = await aiosellSyncRates(req.user.hotelId);

    if (!result.ok) {
      return res.status(400).json({
        success: false,
        message: result.error || "Failed to sync rates",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Rates synced to Aiosell successfully",
    });
  } catch (error) {
    logger.error(error, "Sync All Rates Error");

    return res.status(500).json({
      success: false,
      message: "Failed to sync rates",
    });
  }
};
