import Room from "../models/Room.js";
import RoomType from "#/modules/room-types/models/RoomType.js";
import Booking from "#/modules/bookings/models/Booking.js";
import KeyCard from "#/modules/key-cards/models/KeyCard.js";
import ServiceRequest from "#/modules/service-requests/models/ServiceRequest.js";
import KioskDevice from "#/modules/kiosks/models/KioskDevice.js";
import { getIo } from "#/config/socket.js";
import {
  aiosellSyncInventory,
  calculateSyncDateRange,
} from "#/shared/services/inventory.service.js";
import { refreshRoomTypeCount } from "#/modules/room-types/services/roomType.service.js";
import { roomResponseDTO } from "../dto/room.dto.js";
import logger from "#/utils/logger.js";
import {
  recordApprovalChange,
  detectMappingChange,
  updateEntitySyncStatus,
  CHANNEL_ROOM_FIELDS,
} from "#/modules/channel-manager/approvals/approval-helpers.js";

const ROOM_STATUSES = new Set([
  "available",
  "occupied",
  "reserved",
  "cleaning",
]);

// =====================================================
// GET ALL ROOMS (hotel-scoped, optional status filtering)
// =====================================================

/**
 * Fetches all rooms belonging to a hotel, optionally filtered by status (e.g. 'available', 'occupied', 'cleaning').
 * Used by Receptionist Front Desk Check-In to list only clean vacant rooms ready for assignment,
 * and by Super Admin to configure kiosk room mapping.
 */
export const getRooms = async (req, res) => {
  try {
    const hotelId = req.query.hotelId || req.user.hotelId;
    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: "hotelId is required",
      });
    }

    const filter = { hotelId };

    // Apply status filter if explicitly provided and valid
    if (req.query.status && ROOM_STATUSES.has(req.query.status)) {
      filter.status = req.query.status;
    }

    const rooms = await Room.find(filter).sort({ roomNumber: 1 });

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
      rate === undefined ||
      rate === null ||
      floor === undefined ||
      floor === null
    ) {
      return res.status(400).json({
        success: false,
        message: "roomNumber, rate and floor are required",
      });
    }

    if (rate < 0) {
      return res.status(400).json({
        success: false,
        message: "Rate must be a positive number",
      });
    }

    const code = roomCode?.trim() || null;

    // The room code identifies the room TYPE — every linked room belongs to a
    // locally-mirrored RoomType, so the display label follows the type's name.
    let roomTypeLabel = type;
    if (code) {
      const roomType = await RoomType.findOne({
        hotelId: req.user.hotelId,
        roomCode: code,
      });
      if (!roomType) {
        return res.status(400).json({
          success: false,
          message: `Room type "${code}" not found — add it under Room Types first`,
        });
      }
      roomTypeLabel = roomType.name;
    }

    if (typeof roomTypeLabel !== "string" || !roomTypeLabel.trim()) {
      return res.status(400).json({
        success: false,
        message: "A valid room type is required",
      });
    }

    const room = await Room.create({
      roomNumber: roomNumber.trim(),
      type: roomTypeLabel,
      rate,
      floor,
      roomCode: code,
      // A staff-added linked room is a per-room request: it stays under review
      // (and is blocked from check-in) until a super-admin verifies the room
      // count in Aiosell. Local-only rooms (no code) need no channel review.
      channelSyncStatus: code ? "under_review" : "completed",
      channelVerified: !code,
      hotelId: req.user.hotelId,
    });

    // Record a per-room under-review request so super-admin can add the room
    // (bump the type's count) manually in Aiosell. No automatic push.
    if (code) {
      await recordApprovalChange(req.user.hotelId, "ROOM", code, {
        requestedBy: req.user.id,
        before: null,
        after: {
          roomNumber: room.roomNumber,
          roomCode: code,
          roomType: room.type,
          rate,
          floor,
        },
        roomId: room._id,
        roomNumber: room.roomNumber,
        action: "create",
      });

      // The type's derived count always mirrors the rooms linked to its code.
      await refreshRoomTypeCount(req.user.hotelId, code);
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
      if (typeof type !== "string" || !type.trim()) {
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
      const newCode = roomCode === "" ? null : roomCode.trim();
      const nextCode = newCode?.toLowerCase() ?? null;

      if (nextCode) {
        // The code identifies the room TYPE — when it maps to a local
        // RoomType, the display label follows the type's name.
        const roomType = await RoomType.findOne({
          hotelId: req.user.hotelId,
          roomCode: nextCode,
        });
        if (roomType) {
          allowedUpdates.type = roomType.name;
        }
      }

      allowedUpdates.roomCode = newCode;
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

    const previousRoom = await Room.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    });

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

    // Defensive check: If room is being released/marked as cleaning or available while previously occupied,
    // ensure any active checked-in booking for this room is also cleanly checked out to prevent orphaned active stays.
    if (
      allowedUpdates.status &&
      ["cleaning", "available"].includes(allowedUpdates.status) &&
      previousRoom?.status === "occupied"
    ) {
      try {
        const staleBookings = await Booking.find({
          hotelId: req.user.hotelId,
          roomId: req.params.id,
          status: "checked-in",
        });

        for (const stale of staleBookings) {
          stale.status = "checked-out";
          stale.paymentStatus = "paid";
          stale.auditTrail.push({
            at: new Date(),
            by: req.user._id,
            action: "checked-out",
            from: "checked-in",
            to: "checked-out",
            note: `Auto checked-out: Room ${room.roomNumber} status updated to ${allowedUpdates.status}`,
          });
          await stale.save();
        }
      } catch (autoCheckoutErr) {
        logger.warn(
          autoCheckoutErr,
          "Failed to auto-checkout active stays during room status update",
        );
      }
    }

    // Any edit that changes the Aiosell mapping (code/type/rate/floor) re-opens
    // this room's per-room request to "under_review" — super-admin re-verifies
    // it in Aiosell. `channelVerified` is intentionally left untouched so
    // already-live rooms keep running.
    if (previousRoom) {
      const { changed, before, after } = detectMappingChange(
        previousRoom,
        room,
        CHANNEL_ROOM_FIELDS,
      );

      if (changed && room.roomCode) {
        const approval = await recordApprovalChange(
          req.user.hotelId,
          "ROOM",
          room.roomCode,
          {
            requestedBy: req.user.id,
            before,
            after,
            roomId: room._id,
            roomNumber: room.roomNumber,
            action: "update",
          },
        );

        updateEntitySyncStatus(room, approval);
        await room.save();
      } else if (changed && !room.roomCode) {
        // Code cleared — nothing in the property to verify.
        room.channelSyncStatus = "completed";
        await room.save();
      }

      // A room moved between types: both types' derived counts change.
      if (previousRoom.roomCode !== room.roomCode) {
        if (previousRoom.roomCode) {
          await refreshRoomTypeCount(req.user.hotelId, previousRoom.roomCode);
        }
        if (room.roomCode) {
          await refreshRoomTypeCount(req.user.hotelId, room.roomCode);
        }
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
// FRONT DESK CHECK-OUT ROOM (from Room Grid)
// =====================================================
export const checkOutRoom = async (req, res) => {
  try {
    const roomId = req.params.id;
    const hotelId = req.user.hotelId;
    const { settlementMode = "CASH", notes = "" } = req.body || {};

    const room = await Room.findOne({ _id: roomId, hotelId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // 1. Locate all active checked-in bookings for this room (handles duplicates cleanly)
    const activeBookings = await Booking.find({
      hotelId,
      roomId,
      status: "checked-in",
    }).sort({ createdAt: -1 });

    const checkedOutBookingIds = [];
    for (const booking of activeBookings) {
      const prevStatus = booking.status;
      booking.status = "checked-out";
      booking.paymentStatus = "paid";
      booking.auditTrail.push({
        at: new Date(),
        by: req.user._id,
        action: "checked-out",
        from: prevStatus,
        to: "checked-out",
        note: `Front desk check-out from Room Grid (${room.roomNumber}). Settlement: ${settlementMode}. ${notes}`,
      });
      await booking.save();
      checkedOutBookingIds.push(booking._id);

      // Return & deactivate assigned key cards
      await KeyCard.updateMany(
        { hotelId, currentBookingId: booking._id, status: "ACTIVE" },
        {
          $set: {
            status: "AVAILABLE",
            currentBookingId: null,
            assignedRoomId: null,
            assignedGuestId: null,
            issuedAt: null,
            expiresAt: null,
          },
          $push: {
            auditLog: {
              action: "RETURNED",
              performedBy: req.user._id,
              performedAt: new Date(),
              bookingId: booking._id,
              note: "Key card returned on room checkout via Room Grid",
            },
          },
        },
      );

      // Emit stay status updated to guest
      if (booking.guestId) {
        try {
          const io = getIo();
          io.to(`guest:${booking.guestId}`).emit("stay:status-updated", {
            status: "checked-out",
            roomId,
          });
        } catch {
          // ignore socket error
        }
      }
    }

    // 2. Release room to cleaning state
    room.status = "cleaning";
    room.currentGuest = null;
    room.checkIn = null;
    room.checkOut = null;
    await room.save();

    // 3. Automatically create Housekeeping turnover task
    const primaryBooking = activeBookings.length > 0 ? activeBookings[0] : null;
    try {
      await ServiceRequest.create({
        hotelId,
        guestId: primaryBooking?.guestId || req.user._id,
        roomId,
        type: "HOUSEKEEPING",
        priority: "high",
        description: `Room turnover cleaning after guest check-out (Room ${room.roomNumber})`,
        status: "REQUESTED",
        details: {
          source: "CHECK_OUT_TURNOVER",
          bookingId: primaryBooking?._id || null,
        },
      });
    } catch (housekeepingErr) {
      logger.warn(
        housekeepingErr,
        "Failed to create turnover service request during room checkout",
      );
    }

    // 4. Notify in-room kiosk terminals for this room to auto-logout and return to standby mode
    try {
      const io = getIo();
      const kiosks = await KioskDevice.find({
        hotelId,
        roomId,
        targetDashboard: "GUEST_DASHBOARD",
      });
      for (const k of kiosks) {
        io.to(`device:${k.deviceId}`).emit("kiosk:guest-checked-out", {
          roomId,
        });
      }
      io.to(`room:${roomId}`).emit("kiosk:guest-checked-out", { roomId });
    } catch (kioskErr) {
      logger.warn(
        kioskErr,
        "Failed to push real-time auto-logout event to in-room kiosks during room checkout",
      );
    }

    // 5. Sync inventory with channel manager if primary booking had checkIn and checkOut
    if (primaryBooking && primaryBooking.checkIn && primaryBooking.checkOut) {
      try {
        const [syncStart, syncEnd] = calculateSyncDateRange(
          primaryBooking.checkIn,
          primaryBooking.checkOut,
        );
        await aiosellSyncInventory(hotelId, syncStart, syncEnd);
      } catch (syncErr) {
        logger.warn(syncErr, "Failed to sync inventory during room checkout");
      }
    }

    return res.status(200).json({
      success: true,
      message: `Room ${room.roomNumber} successfully checked out!`,
      data: {
        room: roomResponseDTO(room),
        checkedOutBookingsCount: checkedOutBookingIds.length,
        checkedOutBookingIds,
      },
    });
  } catch (error) {
    logger.error(error, "Check Out Room Error");
    return res.status(500).json({
      success: false,
      message: "Failed to check out room",
    });
  }
};

// =====================================================
// DELETE ROOM
// =====================================================

export const deleteRoom = async (req, res) => {
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

    // Local-only room (no code): nothing to reconcile in Aiosell, delete now.
    if (!room.roomCode) {
      await Room.findByIdAndDelete(room._id);

      return res.status(200).json({
        success: true,
        message: "Room deleted successfully",
        data: roomResponseDTO(room),
      });
    }

    // Already queued — keep it idempotent.
    if (room.pendingDelete) {
      return res.status(200).json({
        success: true,
        message: "This room is already queued for deletion.",
        data: roomResponseDTO(room),
      });
    }

    // =================================================
    // QUEUE DELETE REQUEST (coded room)
    // =================================================
    // A coded room maps to a room type whose count lives in Aiosell. Deleting
    // it requires a super-admin to drop the count there first, so we queue an
    // under-review request and mark the room "pendingDelete" (blocked from
    // check-in). verifyCodeApproval removes it once the count is reduced.

    await recordApprovalChange(req.user.hotelId, "ROOM", room.roomCode, {
      requestedBy: req.user.id,
      before: {
        roomNumber: room.roomNumber,
        roomCode: room.roomCode,
        roomType: room.type,
        rate: room.rate,
        floor: room.floor,
      },
      after: null,
      roomId: room._id,
      roomNumber: room.roomNumber,
      action: "delete",
    });

    room.pendingDelete = true;
    await room.save();

    return res.status(200).json({
      success: true,
      message:
        "Delete request queued — the room will be removed once a super admin reduces the room count in Aiosell and verifies.",
      data: roomResponseDTO(room),
    });
  } catch (error) {
    logger.error(error, "Delete Room Error");

    return res.status(500).json({
      success: false,
      message: "Failed to delete room",
    });
  }
};
