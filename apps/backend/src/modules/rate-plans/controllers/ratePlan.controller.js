// Rate plan CRUD + manual rate sync to Aiosell. Rate changes re-push via
// aiosellSyncRates as a non-blocking side effect (same pattern as inventory).
import RatePlan from "../models/RatePlan.js";
import RoomType from "#/modules/room-types/models/RoomType.js";
import { ratePlanDTO } from "../dto/ratePlan.dto.js";
import { aiosellSyncRates } from "#/shared/services/inventory.service.js";
import { deriveRatePlanCode } from "@hotelos/utils/ratePlanCode";
import {
  KIND_RATE_PLAN,
  getRoomTypeStatus,
  resolveChannelStatus,
} from "#/modules/channel-manager/approvals/approval.service.js";
import {
  recordApprovalChange,
  detectMappingChange,
  updateEntitySyncStatus,
  CHANNEL_RATE_PLAN_FIELDS,
} from "#/modules/channel-manager/approvals/approval-helpers.js";

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
    const { name, ratePlanCode, roomCode, rate, occupancy, mealPlan } =
      req.body;

    if (
      !name?.trim() ||
      !roomCode?.trim() ||
      rate === undefined ||
      rate === null ||
      !occupancy
    ) {
      return res.status(400).json({
        success: false,
        message: "name, roomCode, rate and occupancy are required",
      });
    }

    if (typeof rate !== "number" || rate < 0) {
      return res.status(400).json({
        success: false,
        message: "Rate must be a positive number",
      });
    }

    const roomCodeValue = roomCode.trim().toLowerCase();
    // The room code identifies the room TYPE — every rate plan belongs to a
    // locally-mirrored RoomType, so the label follows the type's name.
    const roomTypeDoc = await RoomType.findOne({
      hotelId: req.user.hotelId,
      roomCode: roomCodeValue,
    });
    if (!roomTypeDoc) {
      return res.status(400).json({
        success: false,
        message: `Room type "${roomCodeValue}" not found — add it under Room Types first`,
      });
    }
    const roomTypeLabel = roomTypeDoc.name;

    // The Aiosell rate plan code is constructive (room + occupancy + meal plan);
    // clients may omit it and we build it here.
    const code = ratePlanCode?.trim()
      ? ratePlanCode.trim().toLowerCase()
      : deriveRatePlanCode(roomCodeValue, occupancy, mealPlan);
    // A rate plan can only be pushed once BOTH its room type and its own
    // ratePlanCode exist in Aiosell (both are created manually + approved).
    const codeStatus = await resolveChannelStatus(
      req.user.hotelId,
      KIND_RATE_PLAN,
      code,
    );
    const roomStatus = await getRoomTypeStatus(req.user.hotelId, roomCodeValue);
    const channelSyncStatus =
      codeStatus === "completed" && roomStatus === "completed"
        ? "completed"
        : "under_review";

    const ratePlan = await RatePlan.create({
      name: name.trim(),
      ratePlanCode: code,
      roomCode: roomCodeValue,
      roomType: roomTypeLabel,
      rate,
      occupancy,
      mealPlan: mealPlan || "EP",
      channelSyncStatus,
      hotelId: req.user.hotelId,
    });

    // Record an under-review change request so super-admin can verify after
    // creating the rate plan manually in Aiosell. No automatic push — the
    // manual flow owns the property.
    await recordApprovalChange(req.user.hotelId, KIND_RATE_PLAN, code, {
      requestedBy: req.user.id,
      before: null,
      after: {
        name: ratePlan.name,
        ratePlanCode: code,
        roomCode: roomCodeValue,
        roomType: roomTypeLabel,
        occupancy,
        mealPlan: mealPlan || "EP",
        rate,
      },
    });

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
    }

    if (roomCode !== undefined) {
      const nextCode = String(roomCode).trim().toLowerCase();

      if (!nextCode) {
        return res.status(400).json({
          success: false,
          message: "Room code cannot be empty",
        });
      }

      const current = await RatePlan.findOne({
        _id: req.params.id,
        hotelId: req.user.hotelId,
      });

      if (current && current.roomCode === nextCode) {
        // Code unchanged — nothing to re-map.
        allowedUpdates.roomCode = nextCode;
      } else {
        const roomTypeDoc = await RoomType.findOne({
          hotelId: req.user.hotelId,
          roomCode: nextCode,
        });
        if (!roomTypeDoc) {
          return res.status(400).json({
            success: false,
            message: `Room type "${nextCode}" not found — add it under Room Types first`,
          });
        }
        allowedUpdates.roomCode = nextCode;
        allowedUpdates.roomType = roomTypeDoc.name;
      }
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

    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    const previousPlan = CHANNEL_RATE_PLAN_FIELDS.some(
      (field) => allowedUpdates[field] !== undefined,
    )
      ? await RatePlan.findOne({
          _id: req.params.id,
          hotelId: req.user.hotelId,
        })
      : null;

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

    // Any edit to the Aiosell mapping/config re-opens the request to
    // "under_review" — super-admin re-verifies the change in Aiosell.
    if (previousPlan) {
      const { changed, before, after } = detectMappingChange(
        previousPlan,
        ratePlan,
        CHANNEL_RATE_PLAN_FIELDS,
      );

      if (changed) {
        const approval = await recordApprovalChange(
          req.user.hotelId,
          KIND_RATE_PLAN,
          ratePlan.ratePlanCode,
          {
            requestedBy: req.user.id,
            before,
            after,
          },
        );

        updateEntitySyncStatus(ratePlan, approval);
        await ratePlan.save();
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
    const startDate = req.body?.startDate || req.query?.startDate;
    const endDate = req.body?.endDate || req.query?.endDate;

    const result = await aiosellSyncRates(req.user.hotelId, startDate, endDate);

    if (!result.ok) {
      return res.status(400).json({
        success: false,
        message: result.error || "Failed to sync rates",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Rates synced to Aiosell successfully (${startDate || "today"} to ${endDate || "+30 days"})`,
      data: result.data || null,
    });
  } catch (error) {
    logger.error(error, "Sync All Rates Error");

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to sync rates",
    });
  }
};
