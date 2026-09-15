import Room from "../models/Room.js";
import { roomResponseDTO } from "../dto/room.dto.js";
import logger from "#/utils/logger.js";
import { aiosellSyncInventory } from "#/shared/services/inventory.service.js";
import {
  KIND_ROOM,
  resolveChannelStatus,
} from "#/modules/channel-manager/services/approval.service.js";

const ROOM_TYPES = new Set(["Standard", "Deluxe", "Suite"]);

const ROOM_STATUSES = new Set([
  "available",
  "occupied",
  "reserved",
  "cleaning",
]);

// =====================================================
// GET ALL ROOMS (hotel-scoped)
// =====================================================

export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({
      hotelId: req.user.hotelId,
    }).sort({ roomNumber: 1 });

    return res.status(200).json({
      success: true,
      message: "Rooms fetched successfully",
      data: rooms.map(roomResponseDTO),
    });
  } catch (error) {
    logger.error(error, "Get Rooms Error");

    return res.status(500).json({
      success: false,
      message: "Failed to fetch rooms",
    });
  }
};

// =====================================================
// GET SINGLE ROOM
// =====================================================

export const getRoomById = async (req, res) => {
  try {
    const room = await Room.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Room fetched successfully",
      data: roomResponseDTO(room),
    });
  } catch (error) {
    logger.error(error, "Get Room Error");

    return res.status(500).json({
      success: false,
      message: "Failed to fetch room",
    });
  }
};

// =====================================================
// CREATE ROOM
// =====================================================

export const createRoom = async (req, res) => {
  try {
    const { roomNumber, type, rate, floor, roomCode } = req.body;

    if (
      !roomNumber?.trim() ||
      !type ||
      rate === undefined ||
      rate === null ||
      floor === undefined ||
      floor === null
    ) {
      return res.status(400).json({
        success: false,
        message: "roomNumber, type, rate and floor are required",
      });
    }

    if (!ROOM_TYPES.has(type)) {
      return res.status(400).json({
        success: false,
        message: "Room type must be Standard, Deluxe or Suite",
      });
    }

    if (rate < 0) {
      return res.status(400).json({
        success: false,
        message: "Rate must be a positive number",
      });
    }

    const code = roomCode?.trim() || null;
    const channelSyncStatus = code
      ? await resolveChannelStatus(req.user.hotelId, KIND_ROOM, code)
      : "completed";

    const room = await Room.create({
      roomNumber: roomNumber.trim(),
      type,
      rate,
      floor,
      roomCode: code,
      channelSyncStatus,
      hotelId: req.user.hotelId,
    });

    // =================================================
    // SYNC INVENTORY TO AIOSELL (non-critical side effect)
    // Only approved codes sync — new codes are "under_review"
    // until a SUPER_ADMIN creates + approves them in Aiosell.
    // =================================================

    if (room.roomCode && room.channelSyncStatus === "completed") {
      await aiosellSyncInventory(req.user.hotelId);
    }

    return res.status(201).json({
      success: true,
      message: "Room created successfully",
      data: roomResponseDTO(room),
    });
  } catch (error) {
    logger.error(error, "Create Room Error");

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A room with this number already exists in your hotel",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create room",
    });
  }
};

// =====================================================
// UPDATE ROOM
// =====================================================

export const updateRoom = async (req, res) => {
  try {
    const allowedUpdates = {};

    const {
      status,
      type,
      rate,
      floor,
      currentGuest,
      checkIn,
      checkOut,
      roomCode,
    } = req.body;

    if (status !== undefined) {
      if (!ROOM_STATUSES.has(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid room status",
        });
      }

      allowedUpdates.status = status;
    }

    if (type !== undefined) {
      if (!ROOM_TYPES.has(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid room type",
        });
      }

      allowedUpdates.type = type;
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

    if (floor !== undefined) {
      allowedUpdates.floor = floor;
    }

    if (roomCode !== undefined) {
      const code = roomCode === "" ? null : roomCode.trim();
      // New/changed codes go "under_review" unless the code is already approved
      // (see ChannelApproval); a cleared code is neutral, so it resets to
      // "completed" (no review needed — nothing to sync for it).
      const status = code
        ? await resolveChannelStatus(req.user.hotelId, KIND_ROOM, code)
        : "completed";

      allowedUpdates.roomCode = code;
      allowedUpdates.channelSyncStatus = status;
    }

    // Occupancy display fields (guest record linking arrives in Phase B2)
    if (currentGuest !== undefined) {
      allowedUpdates.currentGuest = currentGuest === "" ? null : currentGuest;
    }

    if (checkIn !== undefined) {
      allowedUpdates.checkIn = checkIn ? new Date(checkIn) : null;
    }

    if (checkOut !== undefined) {
      allowedUpdates.checkOut = checkOut ? new Date(checkOut) : null;
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    const previousRoom =
      "roomCode" in allowedUpdates
        ? await Room.findOne({
            _id: req.params.id,
            hotelId: req.user.hotelId,
          })
        : null;

    const room = await Room.findOneAndUpdate(
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

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // =================================================
    // SYNC INVENTORY TO AIOSELL (non-critical side effect)
    // Push only when the final mapping is synced-to-Aiosell:
    //   - code set to an approved code, or cleared (approved-code group shrank),
    //   - OR the room moved OFF an approved code (its old count changed) even
    //     if the new code is still "under_review" (unapproved codes are
    //     excluded from the payload).
    // =================================================

    if ("roomCode" in allowedUpdates) {
      const needsSync =
        room.roomCode !== null && room.channelSyncStatus === "completed"
          ? true
          : previousRoom?.roomCode &&
            previousRoom.channelSyncStatus === "completed" &&
            previousRoom.roomCode !== room.roomCode;

      if (needsSync) {
        await aiosellSyncInventory(req.user.hotelId);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Room updated successfully",
      data: roomResponseDTO(room),
    });
  } catch (error) {
    logger.error(error, "Update Room Error");

    return res.status(500).json({
      success: false,
      message: "Failed to update room",
    });
  }
};

// =====================================================
// DELETE ROOM
// =====================================================

export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findOneAndDelete({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // =================================================
    // SYNC INVENTORY TO AIOSELL (non-critical side effect)
    // =================================================

    if (room.roomCode) {
      await aiosellSyncInventory(req.user.hotelId);
    }

    return res.status(200).json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    logger.error(error, "Delete Room Error");

    return res.status(500).json({
      success: false,
      message: "Failed to delete room",
    });
  }
};
