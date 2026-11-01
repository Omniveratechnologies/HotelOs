import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import Booking from "../models/Booking.js";
import Room from "#/modules/rooms/models/Room.js";
import User from "#/modules/users/models/User.js";
import KeyCard from "#/modules/key-cards/models/KeyCard.js";
import ServiceRequest from "#/modules/service-requests/models/ServiceRequest.js";
import Order from "#/modules/orders/models/Order.js";
import KioskDevice from "#/modules/kiosks/models/KioskDevice.js";
import { getIo } from "#/config/socket.js";
import { bookingDTO } from "../dto/booking.dto.js";
import {
  aiosellSyncInventory,
  calculateSyncDateRange,
} from "#/shared/services/inventory.service.js";
import logger from "#/utils/logger.js";

// =====================================================
// FRONT DESK ARRIVALS QUEUE
// =====================================================
export const getArrivals = async (req, res) => {
  try {
    const { date, expressOnly, q, bookingId } = req.query;
    const hotelId = req.user.hotelId;

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const baseStatusFilter = {
      hotelId,
      status: { $in: ["confirmed", "reserved", "pending"] },
    };

    let filter;
    if (bookingId && mongoose.Types.ObjectId.isValid(bookingId)) {
      filter = {
        ...baseStatusFilter,
        $or: [
          { checkIn: { $lte: endOfDay } },
          { _id: new mongoose.Types.ObjectId(bookingId) },
        ],
      };
    } else {
      filter = {
        ...baseStatusFilter,
        checkIn: { $lte: endOfDay },
      };
    }

    if (expressOnly === "true") {
      filter.checkInVerified = true;
    }

    const arrivals = await Booking.find(filter)
      .populate(
        "guestId",
        "name email phone nationality idType idNumber address documents",
      )
      .populate(
        "roomId",
        "roomNumber type rate floor roomCode status housekeepingStatus",
      )
      .populate(
        "roomAllocations.roomId",
        "roomNumber type rate floor roomCode status housekeepingStatus",
      )
      .populate("ratePlanId", "name mealPlan")
      .sort({ checkIn: 1 })
      .lean();

    const formatted = arrivals
      .filter((b) => {
        if (!q?.trim()) return true;
        const rx = new RegExp(q.trim(), "i");
        return (
          rx.test(b.reservationNo || "") ||
          rx.test(b.guestId?.name || "") ||
          rx.test(b.guestId?.phone || "") ||
          rx.test(b.roomId?.roomNumber || "") ||
          (bookingId && String(b._id) === String(bookingId))
        );
      })
      .map((b) => {
        const allocatedRoomNums = (b.roomAllocations || [])
          .map((a) => a.roomNumber || a.roomId?.roomNumber)
          .filter(Boolean);

        const assignedRoomIds = [
          ...(b.roomId?._id
            ? [String(b.roomId._id)]
            : b.roomId
              ? [String(b.roomId)]
              : []),
          ...(Array.isArray(b.roomAllocations)
            ? b.roomAllocations
                .map((a) =>
                  a.roomId?._id
                    ? String(a.roomId._id)
                    : a.roomId
                      ? String(a.roomId)
                      : null,
                )
                .filter(Boolean)
            : []),
        ].filter((val, idx, arr) => arr.indexOf(val) === idx);

        const roomsCount =
          b.rooms ||
          (Array.isArray(b.roomRequirements) && b.roomRequirements.length > 0
            ? b.roomRequirements.reduce((sum, r) => sum + (r.rooms || 0), 0)
            : b.roomAllocations?.length || 1);

        const roomDisplay =
          allocatedRoomNums.length > 0
            ? `Room ${allocatedRoomNums.join(", ")}`
            : b.roomId?.roomNumber
              ? `Room ${b.roomId.roomNumber}`
              : roomsCount > 1
                ? `${roomsCount} Rooms (Unassigned)`
                : null;

        return {
          id: b._id,
          bookingNo: b.reservationNo || null,
          guestId: b.guestId?._id || null,
          name: b.guestId?.name || "Guest",
          phone: b.guestId?.phone || null,
          email: b.guestId?.email || null,
          nationality: b.guestId?.nationality || null,
          address: b.guestId?.address || null,
          idType: b.guestId?.idType || null,
          idNumber: b.guestId?.idNumber || null,
          documents: b.guestId?.documents || [],
          adults: b.adults || 1,
          children: b.children || 0,
          time: b.checkIn
            ? new Date(b.checkIn).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : null,
          room: roomDisplay,
          roomId: b.roomId?._id || null,
          assignedRoomIds,
          roomsCount,
          roomTypeCode: b.roomTypeCode || null,
          mealPlan: b.mealPlan || b.ratePlanId?.mealPlan || null,
          roomType:
            b.roomRequirements && b.roomRequirements.length > 0
              ? b.roomRequirements
                  .map((r) => `${r.rooms} ${r.roomTypeCode.toUpperCase()}`)
                  .join(", ")
              : b.roomTypeCode
                ? b.roomTypeCode.toUpperCase()
                : b.roomId?.type || null,
          roomAllocations: b.roomAllocations || [],
          roomRequirements: b.roomRequirements || [],
          groupInfo: b.groupInfo || null,
          source: b.source || "DIRECT",
          isRepeat: b.source === "REPEAT_GUEST",
          isVip: b.source === "REPEAT_GUEST" || b.guestType === "vip",
          isExpress: Boolean(b.checkInVerified),
          checkIn: b.checkIn
            ? new Date(b.checkIn).toISOString().slice(0, 10)
            : null,
          checkOut: b.checkOut
            ? new Date(b.checkOut).toISOString().slice(0, 10)
            : null,
          nights:
            Math.max(
              1,
              Math.round(
                (new Date(b.checkOut) - new Date(b.checkIn)) / 86400000,
              ),
            ) || 1,
          guests: (b.adults || 1) + (b.children || 0),
          ratePlan: b.ratePlanId?.name || null,
          specialRequests: b.specialRequests || null,
          status: b.status,
          paymentStatus: b.paymentStatus || "unpaid",
          totalAmount: b.pricing?.grandTotal || b.totalAmountBeforeTax || 0,
          isGuaranteed:
            b.status === "confirmed" &&
            (b.paymentStatus === "paid" ||
              b.otaInfo?.paymentStatus === "prepaid-by-ota"),
          requiresDeposit:
            b.status === "reserved" ||
            b.status === "pending" ||
            b.paymentStatus !== "paid",
        };
      });

    return res.status(200).json({
      success: true,
      message: "Arrivals fetched",
      data: formatted,
    });
  } catch (error) {
    logger.error(error, "Get Arrivals Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch arrivals queue" });
  }
};

// =====================================================
// FRONT DESK DEPARTURES QUEUE
// =====================================================
export const getDepartures = async (req, res) => {
  try {
    const { q } = req.query;
    const hotelId = req.user.hotelId;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const departures = await Booking.find({
      hotelId,
      status: "checked-in",
    })
      .populate("guestId", "name email phone nationality address")
      .populate("roomId", "roomNumber type rate floor roomCode")
      .sort({ checkOut: 1 })
      .lean();

    const formatted = departures
      .filter((b) => {
        if (!q?.trim()) return true;
        const rx = new RegExp(q.trim(), "i");
        return (
          rx.test(b.reservationNo || "") ||
          rx.test(b.guestId?.name || "") ||
          rx.test(b.guestId?.phone || "") ||
          rx.test(b.roomId?.roomNumber || "")
        );
      })
      .map((b) => {
        const checkOutDate = new Date(b.checkOut);
        const isOverstay = checkOutDate < startOfToday;
        const nights =
          Math.max(
            1,
            Math.round((checkOutDate - new Date(b.checkIn)) / 86400000),
          ) || 1;
        const totalCharges =
          b.pricing?.grandTotal || (b.pricing?.nightlyRate || 2500) * nights;

        return {
          id: b._id,
          bookingNo: b.reservationNo || null,
          name: b.guestId?.name || "Guest",
          phone: b.guestId?.phone || null,
          email: b.guestId?.email || null,
          location: b.guestId?.address || null,
          room: b.roomId?.roomNumber ? String(b.roomId.roomNumber) : null,
          roomId: b.roomId?._id || null,
          roomType: b.roomId?.type || b.roomTypeCode?.toUpperCase() || null,
          checkIn: b.checkIn
            ? new Date(b.checkIn).toISOString().slice(0, 10)
            : null,
          checkOut: b.checkOut
            ? new Date(b.checkOut).toISOString().slice(0, 10)
            : null,
          checkoutTime: "11:00 AM",
          nights,
          guests: (b.adults || 1) + (b.children || 0),
          isOverstay,
          totalCharges,
          paymentStatus: b.paymentStatus || "unpaid",
          status: b.status,
        };
      });

    return res.status(200).json({
      success: true,
      message: "Departures fetched",
      data: formatted,
    });
  } catch (error) {
    logger.error(error, "Get Departures Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch departures queue" });
  }
};

// =====================================================
// FRONT DESK STATS
// =====================================================
export const getFrontDeskStats = async (req, res) => {
  try {
    const hotelId = req.user.hotelId;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [
      pendingArrivals,
      checkedInToday,
      departuresDue,
      checkedOutToday,
      activeKeysCount,
      overstayCount,
    ] = await Promise.all([
      Booking.countDocuments({
        hotelId,
        status: { $in: ["confirmed", "reserved", "pending"] },
        checkIn: { $lte: endOfToday },
      }),
      Booking.countDocuments({
        hotelId,
        status: "checked-in",
        "auditTrail.action": "checked-in",
        "auditTrail.at": { $gte: startOfToday },
      }),
      Booking.countDocuments({
        hotelId,
        status: "checked-in",
        checkOut: { $lte: endOfToday },
      }),
      Booking.countDocuments({
        hotelId,
        status: "checked-out",
        "auditTrail.action": "checked-out",
        "auditTrail.at": { $gte: startOfToday },
      }),
      KeyCard.countDocuments({
        hotelId,
        status: "ACTIVE",
      }),
      Booking.countDocuments({
        hotelId,
        status: "checked-in",
        checkOut: { $lt: startOfToday },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Front desk stats fetched",
      data: {
        pendingArrivals,
        checkedInToday,
        departuresDue,
        checkedOutToday,
        activeKeysCount,
        overstayCount,
      },
    });
  } catch (error) {
    logger.error(error, "Get Front Desk Stats Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch front desk stats" });
  }
};

// =====================================================
// FRONT DESK CHECK-IN
// =====================================================
export const checkInBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      roomId,
      roomIds,
      keyCardNumber,
      keyCardNumbers,
      depositAmount = 0,
      paymentMode = "CASH",
      notes,
      documents,
      idType,
      idNumber,
    } = req.body;
    const hotelId = req.user.hotelId;

    const booking = await Booking.findOne({ _id: id, hotelId });
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    if (
      !["confirmed", "reserved", "pending", "draft"].includes(booking.status)
    ) {
      return res.status(409).json({
        success: false,
        message: `Cannot check in booking with status "${booking.status}"`,
      });
    }

    const incomingRoomIds =
      Array.isArray(roomIds) && roomIds.length > 0
        ? roomIds.map(String).filter(Boolean)
        : roomId
          ? [String(roomId)]
          : [];

    const fallbackRoomIds = [
      ...(booking.roomId ? [String(booking.roomId)] : []),
      ...(Array.isArray(booking.roomAllocations)
        ? booking.roomAllocations
            .map((a) =>
              a.roomId?._id
                ? String(a.roomId._id)
                : a.roomId
                  ? String(a.roomId)
                  : null,
            )
            .filter(Boolean)
        : []),
    ];

    const targetRoomIds = Array.from(
      new Set(incomingRoomIds.length > 0 ? incomingRoomIds : fallbackRoomIds),
    );

    if (targetRoomIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please assign at least one room before completing check-in",
      });
    }

    // Verify and claim all assigned rooms
    const rooms = await Room.find({ _id: { $in: targetRoomIds }, hotelId });
    if (rooms.length !== targetRoomIds.length) {
      return res
        .status(404)
        .json({
          success: false,
          message: "One or more assigned rooms not found",
        });
    }

    // Clean up any stale active checked-in bookings on any of these rooms
    const staleBookings = await Booking.find({
      hotelId,
      $or: [
        { roomId: { $in: targetRoomIds } },
        { "roomAllocations.roomId": { $in: targetRoomIds } },
      ],
      status: "checked-in",
      _id: { $ne: booking._id },
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
        note: `Auto checked-out: room reassigned/checked in to new reservation ${booking.reservationNo}`,
      });
      await stale.save();
    }

    const guestUser = await User.findById(booking.guestId).select("name phone");
    const guestName = guestUser?.name || "Valued Guest";

    if (booking.guestId && (Array.isArray(documents) || idType || idNumber)) {
      const guestUpdates = {};
      if (idType) guestUpdates.idType = idType;
      if (idNumber) guestUpdates.idNumber = idNumber;
      if (Array.isArray(documents) && documents.length > 0) {
        if (!guestUpdates.idType && documents[0]?.idType) {
          guestUpdates.idType = documents[0].idType;
        }
        if (!guestUpdates.idNumber && documents[0]?.idNumber) {
          guestUpdates.idNumber = documents[0].idNumber;
        }
      }
      if (Object.keys(guestUpdates).length > 0) {
        await User.findByIdAndUpdate(booking.guestId, { $set: guestUpdates });
      }
    }

    await Room.updateMany(
      { _id: { $in: targetRoomIds }, hotelId },
      {
        $set: {
          status: "occupied",
          currentGuest: guestName,
          checkIn: booking.checkIn || new Date(),
          checkOut: booking.checkOut || null,
        },
      },
    );

    const primaryRoom = rooms[0];
    const previousStatus = booking.status;
    booking.status = "checked-in";
    booking.roomId = primaryRoom._id;
    booking.rooms = Math.max(booking.rooms || 1, targetRoomIds.length);
    booking.checkInVerified = true;

    // Synchronize room allocations
    if (
      !Array.isArray(booking.roomAllocations) ||
      booking.roomAllocations.length === 0
    ) {
      booking.roomAllocations = targetRoomIds.map((rId, idx) => {
        const rm = rooms.find((r) => String(r._id) === String(rId));
        return {
          allocationId: `alloc-${Date.now()}-${idx}`,
          roomTypeCode: (
            rm?.roomCode ||
            rm?.type ||
            booking.roomTypeCode ||
            ""
          ).toLowerCase(),
          roomId: rId,
          roomNumber: rm?.roomNumber || null,
          adults: 1,
          children: 0,
          status: "assigned",
        };
      });
    } else {
      targetRoomIds.forEach((rId, idx) => {
        const rm = rooms.find((r) => String(r._id) === String(rId));
        if (booking.roomAllocations[idx]) {
          booking.roomAllocations[idx].roomId = rId;
          booking.roomAllocations[idx].roomNumber =
            rm?.roomNumber || booking.roomAllocations[idx].roomNumber;
          booking.roomAllocations[idx].status = "assigned";
        } else {
          booking.roomAllocations.push({
            allocationId: `alloc-${Date.now()}-${idx}`,
            roomTypeCode: (
              rm?.roomCode ||
              rm?.type ||
              booking.roomTypeCode ||
              ""
            ).toLowerCase(),
            roomId: rId,
            roomNumber: rm?.roomNumber || null,
            adults: 1,
            children: 0,
            status: "assigned",
          });
        }
      });
    }

    if (depositAmount > 0) {
      booking.pricing = booking.pricing || {};
      booking.paymentStatus = "partially-paid";
    }

    const roomDisplayList = rooms.map((r) => r.roomNumber).join(", ");
    booking.auditTrail.push({
      at: new Date(),
      by: req.user._id,
      action: "checked-in",
      from: previousStatus,
      to: "checked-in",
      note: `Front desk check-in into Room(s): ${roomDisplayList}. Deposit: ₹${depositAmount} (${paymentMode}). ${notes || ""}`,
    });

    await booking.save();

    // Assign Key Card(s) if provided
    const rawCardInput = keyCardNumbers || keyCardNumber;
    if (rawCardInput) {
      const cardList = (
        Array.isArray(rawCardInput)
          ? rawCardInput
          : String(rawCardInput).split(",")
      )
        .map((c) => String(c).trim().toUpperCase())
        .filter(Boolean);

      for (let idx = 0; idx < cardList.length; idx++) {
        const cleanCardNo = cardList[idx];
        const assignedRoomForCard = targetRoomIds[idx] || primaryRoom._id;
        const rmObj = rooms.find(
          (r) => String(r._id) === String(assignedRoomForCard),
        );

        let card = await KeyCard.findOne({ hotelId, cardNumber: cleanCardNo });
        if (!card) {
          card = new KeyCard({ hotelId, cardNumber: cleanCardNo });
        }
        card.status = "ACTIVE";
        card.currentBookingId = booking._id;
        card.assignedRoomId = assignedRoomForCard;
        card.assignedGuestId = booking.guestId;
        card.issuedAt = new Date();
        card.expiresAt = booking.checkOut;
        card.auditLog.push({
          action: "ASSIGNED",
          performedBy: req.user._id,
          bookingId: booking._id,
          note: `Issued at Front Desk Check-in for Room ${rmObj?.roomNumber || assignedRoomForCard}`,
        });
        await card.save();
      }
    }

    // Trigger Aiosell Inventory sync
    const [syncStart, syncEnd] = calculateSyncDateRange(
      booking.checkIn,
      booking.checkOut,
    );
    await aiosellSyncInventory(hotelId, syncStart, syncEnd);

    // Notify in-room kiosk terminals for these rooms to auto-login as this guest
    try {
      const kiosks = await KioskDevice.find({
        hotelId,
        roomId: { $in: targetRoomIds },
        targetDashboard: "GUEST_DASHBOARD",
        isActive: true,
      });

      const io = getIo();

      for (const targetId of targetRoomIds) {
        const rmObj =
          rooms.find((r) => String(r._id) === String(targetId)) || primaryRoom;
        const guestToken = booking.guestId
          ? jwt.sign(
              {
                userId: booking.guestId,
                role: "GUEST",
                hotelId,
                roomId: targetId,
              },
              process.env.JWT_SECRET || "default_jwt_secret",
              { expiresIn: "8h" },
            )
          : null;

        const checkInPayload = {
          roomId: targetId,
          roomNumber: rmObj.roomNumber,
          guestId: booking.guestId,
          guestName,
          guestToken,
          user: booking.guestId
            ? {
                id: booking.guestId,
                name: guestName,
                role: "GUEST",
                hotelId,
                roomId: targetId,
              }
            : null,
          booking: {
            id: booking._id,
            reservationNo: booking.reservationNo,
            status: "checked-in",
            roomId: targetId,
            roomNumber: rmObj.roomNumber,
          },
        };

        const targetKiosks = kiosks.filter(
          (k) => String(k.roomId) === String(targetId),
        );
        for (const k of targetKiosks) {
          io.to(`device:${k.deviceId}`).emit(
            "kiosk:guest-checked-in",
            checkInPayload,
          );
        }
        io.to(`room:${targetId}`).emit(
          "kiosk:guest-checked-in",
          checkInPayload,
        );
      }

      if (booking.guestId) {
        io.to(`guest:${booking.guestId}`).emit("stay:status-updated", {
          status: "checked-in",
          roomId: primaryRoom._id,
          roomNumber: primaryRoom.roomNumber,
          reservationNo: booking.reservationNo,
        });
      }
    } catch (kioskErr) {
      logger.warn(
        kioskErr,
        "Failed to push real-time auto-login event to in-room kiosks",
      );
    }

    return res.status(200).json({
      success: true,
      message: `Guest ${guestName} successfully checked into Room ${room.roomNumber}!`,
      data: await bookingDTO(booking),
    });
  } catch (error) {
    logger.error(error, "Check-in Booking Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to check in guest" });
  }
};

// =====================================================
// FRONT DESK CHECK-OUT
// =====================================================
export const checkOutBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { settlementMode = "CASH", notes } = req.body;
    const hotelId = req.user.hotelId;

    const booking = await Booking.findOne({ _id: id, hotelId });
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    if (booking.status !== "checked-in") {
      return res.status(409).json({
        success: false,
        message: `Cannot check out booking with status "${booking.status}". Must be checked-in.`,
      });
    }

    const roomId = booking.roomId;

    // Transition booking
    const previousStatus = booking.status;
    booking.status = "checked-out";
    booking.paymentStatus = "paid";
    booking.auditTrail.push({
      at: new Date(),
      by: req.user._id,
      action: "checked-out",
      from: previousStatus,
      to: "checked-out",
      note: `Front desk check-out. Settlement mode: ${settlementMode}. ${notes || ""}`,
    });
    await booking.save();

    // Release Room to cleaning state
    if (roomId) {
      const room = await Room.findById(roomId);
      await Room.findByIdAndUpdate(roomId, {
        status: "cleaning",
        currentGuest: null,
        checkIn: null,
        checkOut: null,
      });

      // Automatically create Housekeeping turnover task
      await ServiceRequest.create({
        hotelId,
        guestId: booking.guestId || req.user._id,
        roomId,
        type: "HOUSEKEEPING",
        priority: "high",
        description: `Room turnover cleaning after guest check-out (Room ${room?.roomNumber || "N/A"})`,
        status: "REQUESTED",
        details: { source: "CHECK_OUT_TURNOVER", bookingId: booking._id },
      });
    }

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
            note: "Key card returned on guest checkout",
          },
        },
      },
    );

    // Sync inventory with channel manager
    const [syncStart, syncEnd] = calculateSyncDateRange(
      booking.checkIn,
      booking.checkOut,
    );
    await aiosellSyncInventory(hotelId, syncStart, syncEnd);

    // Notify in-room kiosk terminals for this room to auto-logout and return to standby mode
    try {
      const io = getIo();
      if (roomId) {
        const kiosks = await KioskDevice.find({
          hotelId,
          roomId,
          targetDashboard: "GUEST_DASHBOARD",
        });

        // Emit kiosk:guest-checked-out in-place without triggering destructive device:reload
        for (const k of kiosks) {
          io.to(`device:${k.deviceId}`).emit("kiosk:guest-checked-out", {
            roomId,
          });
        }
        io.to(`room:${roomId}`).emit("kiosk:guest-checked-out", { roomId });
      }
      if (booking.guestId) {
        io.to(`guest:${booking.guestId}`).emit("stay:status-updated", {
          status: "checked-out",
          roomId,
        });
      }
    } catch (kioskErr) {
      logger.warn(
        kioskErr,
        "Failed to push real-time auto-logout event to in-room kiosks",
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Guest successfully checked out. Turnover cleaning task dispatched.",
      data: await bookingDTO(booking),
    });
  } catch (error) {
    logger.error(error, "Check-out Booking Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to check out guest" });
  }
};

// =====================================================
// GET LIVE BOOKING FOLIO (CHARGES BREAKDOWN)
// =====================================================
export const getBookingFolio = async (req, res) => {
  try {
    const { id } = req.params;
    const hotelId = req.user.hotelId;

    const booking = await Booking.findOne({ _id: id, hotelId })
      .populate("guestId", "name email phone")
      .populate("roomId", "roomNumber type rate")
      .lean();

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // Stay charges
    const nights =
      Math.max(
        1,
        Math.round(
          (new Date(booking.checkOut) - new Date(booking.checkIn)) / 86400000,
        ),
      ) || 1;
    const nightlyRate =
      booking.pricing?.nightlyRate || booking.roomId?.rate || 2999;
    const stayTariffTotal = nightlyRate * nights;

    // Restaurant orders during stay
    const orders = await Order.find({
      hotelId,
      bookingId: booking._id,
      status: { $ne: "cancelled" },
    }).lean();

    const otherCharges = orders.map((o) => ({
      date: new Date(o.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      desc: `F&B Order #${o.orderNumber || o._id.toString().slice(-4)}`,
      qty: `${o.items?.length || 1} Item(s)`,
      rate: o.totalAmount || 0,
      amount: o.totalAmount || 0,
    }));

    const ordersTotal = otherCharges.reduce((acc, c) => acc + c.amount, 0);
    const taxes = Math.round((stayTariffTotal + ordersTotal) * 0.12);
    const grandTotal = stayTariffTotal + ordersTotal + taxes;

    return res.status(200).json({
      success: true,
      message: "Booking folio fetched",
      data: {
        bookingId: booking._id,
        reservationNo: booking.reservationNo,
        guestName: booking.guestId?.name,
        roomNumber: booking.roomId?.roomNumber,
        nights,
        nightlyRate,
        stayTariffTotal,
        stayCharges: [
          {
            date: new Date(booking.checkIn).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            desc: `${booking.roomId?.type || "Room"} Tariff (${nights} Nights)`,
            qty: `${nights} Night(s)`,
            rate: nightlyRate,
            amount: stayTariffTotal,
          },
        ],
        otherCharges,
        taxes,
        grandTotal,
        paymentStatus: booking.paymentStatus,
      },
    });
  } catch (error) {
    logger.error(error, "Get Booking Folio Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch folio charges" });
  }
};
