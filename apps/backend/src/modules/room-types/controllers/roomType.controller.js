import RoomType from "../models/RoomType.js";
import Room from "#/modules/rooms/models/Room.js";
import { roomTypeDTO } from "../dto/roomType.dto.js";
import RatePlan from "#/modules/rate-plans/models/RatePlan.js";
import {
  KIND_ROOM_TYPE,
  resolveChannelStatus,
  recordRequest,
} from "#/modules/channel-manager/approvals/approval.service.js";
import logger from "#/utils/logger.js";

// Only config fields are editable on an existing type — the code identifies the
// type in Aiosell and the count is derived from the linked rooms.
const CHANNEL_ROOM_TYPE_FIELDS = [
  "name",
  "description",
  "active",
  "minOccupancy",
  "maxOccupancy",
];

const roomTypeSnapshot = (roomType) => ({
  roomCode: roomType.roomCode,
  name: roomType.name,
  description: roomType.description,
  count: roomType.count,
  active: roomType.active,
  minOccupancy: roomType.minOccupancy,
  maxOccupancy: roomType.maxOccupancy,
});

// =====================================================
// GET ALL ROOM TYPES (hotel-scoped)
// =====================================================

export const getRoomTypes = async (req, res) => {
  try {
    const roomTypes = await RoomType.find({
      hotelId: req.user.hotelId,
    }).sort({ roomCode: 1 });

    return res.status(200).json({
      success: true,
      message: "Room types fetched successfully",
      data: roomTypes.map(roomTypeDTO),
    });
  } catch (error) {
    logger.error(error, "Get Room Types Error");

    return res.status(500).json({
      success: false,
      message: "Failed to fetch room types",
    });
  }
};

// =====================================================
// CREATE ROOM TYPE (+ bundled room records)
// =====================================================

export const createRoomType = async (req, res) => {
  try {
    const {
      roomCode,
      name,
      description,
      count,
      active,
      minOccupancy,
      maxOccupancy,
      rooms,
    } = req.validated.body;

    const code = roomCode.trim().toLowerCase();

    const channelSyncStatus = await resolveChannelStatus(
      req.user.hotelId,
      KIND_ROOM_TYPE,
      code,
    );

    const roomType = await RoomType.create({
      roomCode: code,
      name: name.trim(),
      description: description?.trim() || "",
      count,
      active: active === undefined ? true : Boolean(active),
      minOccupancy,
      maxOccupancy,
      channelSyncStatus,
      hotelId: req.user.hotelId,
    });

    // Bulk-create the room records linked to this type.
    const roomDocs = rooms.map((r) => ({
      roomNumber: r.roomNumber.trim(),
      type: name.trim(),
      rate: Number(r.rate),
      floor: Number(r.floor),
      roomCode: code,
      channelSyncStatus: "under_review",
      channelVerified: false,
      hotelId: req.user.hotelId,
    }));

    try {
      await Room.insertMany(roomDocs);
    } catch (insertError) {
      // Roll back the just-created RoomType and any inserted rooms.
      await RoomType.findByIdAndDelete(roomType._id).catch(() => {});
      await Room.deleteMany({
        hotelId: req.user.hotelId,
        roomCode: code,
      }).catch(() => {});

      if (insertError.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "A room with that number already exists in your hotel",
        });
      }

      throw insertError;
    }

    const approvalSnapshot = {
      roomCode: code,
      name: roomType.name,
      description: roomType.description,
      count,
      active: roomType.active,
      minOccupancy,
      maxOccupancy,
      rooms: rooms.map((r) => r.roomNumber.trim()),
    };

    await recordRequest(req.user.hotelId, KIND_ROOM_TYPE, code, {
      requestedBy: req.user.id,
      before: null,
      after: approvalSnapshot,
      action: "create",
    });

    return res.status(201).json({
      success: true,
      message: "Room type created successfully",
      data: roomTypeDTO(roomType),
    });
  } catch (error) {
    logger.error(error, "Create Room Type Error");

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A room type with this code already exists in your hotel",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create room type",
    });
  }
};

// =====================================================
// UPDATE ROOM TYPE
// =====================================================

export const updateRoomType = async (req, res) => {
  try {
    const { id } = req.validated.params;
    const { name, description, active, minOccupancy, maxOccupancy } =
      req.validated.body;

    const allowedUpdates = {};

    if (name !== undefined) allowedUpdates.name = name.trim();
    if (description !== undefined)
      allowedUpdates.description = description.trim() || "";
    if (active !== undefined) allowedUpdates.active = Boolean(active);
    if (minOccupancy !== undefined) allowedUpdates.minOccupancy = minOccupancy;
    if (maxOccupancy !== undefined) allowedUpdates.maxOccupancy = maxOccupancy;

    const previousRoomType = CHANNEL_ROOM_TYPE_FIELDS.some(
      (field) => allowedUpdates[field] !== undefined,
    )
      ? await RoomType.findOne({
          _id: id,
          hotelId: req.user.hotelId,
        })
      : null;

    const roomType = await RoomType.findOneAndUpdate(
      {
        _id: id,
        hotelId: req.user.hotelId,
      },
      allowedUpdates,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!roomType) {
      return res.status(404).json({
        success: false,
        message: "Room type not found",
      });
    }

    if (previousRoomType) {
      const mappingChanged = CHANNEL_ROOM_TYPE_FIELDS.some(
        (field) =>
          allowedUpdates[field] !== undefined &&
          String(previousRoomType[field] ?? "") !==
            String(roomType[field] ?? ""),
      );

      if (mappingChanged) {
        const approval = await recordRequest(
          req.user.hotelId,
          KIND_ROOM_TYPE,
          roomType.roomCode,
          {
            requestedBy: req.user.id,
            before: roomTypeSnapshot(previousRoomType),
            after: roomTypeSnapshot(roomType),
          },
        );

        roomType.channelSyncStatus = approval.status;
        await roomType.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Room type updated successfully",
      data: roomTypeDTO(roomType),
    });
  } catch (error) {
    logger.error(error, "Update Room Type Error");

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A room type with this code already exists in your hotel",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update room type",
    });
  }
};

// =====================================================
// DELETE ROOM TYPE
// =====================================================

export const deleteRoomType = async (req, res) => {
  try {
    const { id } = req.validated.params;
    const roomType = await RoomType.findOne({
      _id: id,
      hotelId: req.user.hotelId,
    });

    if (!roomType) {
      return res.status(404).json({
        success: false,
        message: "Room type not found",
      });
    }

    const linkedRooms = await Room.countDocuments({
      hotelId: req.user.hotelId,
      roomCode: roomType.roomCode,
    });
    const linkedPlans = await RatePlan.countDocuments({
      hotelId: req.user.hotelId,
      roomCode: roomType.roomCode,
    });

    if (linkedRooms > 0 || linkedPlans > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete this room type — it is used by ${linkedRooms} room${
          linkedRooms === 1 ? "" : "s"
        } and ${linkedPlans} rate plan${linkedPlans === 1 ? "" : "s"}. Remove or reassign them first.`,
      });
    }

    await RoomType.findByIdAndDelete(roomType._id);

    return res.status(200).json({
      success: true,
      message: "Room type deleted successfully",
    });
  } catch (error) {
    logger.error(error, "Delete Room Type Error");

    return res.status(500).json({
      success: false,
      message: "Failed to delete room type",
    });
  }
};
