import Booking from "../models/Booking.js";
import Room from "#/modules/rooms/models/Room.js";
import User from "#/modules/users/models/User.js";
import KeyCard from "#/modules/key-cards/models/KeyCard.js";
import ServiceRequest from "#/modules/service-requests/models/ServiceRequest.js";
import Order from "#/modules/orders/models/Order.js";
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
    const { date, expressOnly, q } = req.query;
    const hotelId = req.user.hotelId;

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const filter = {
      hotelId,
      status: { $in: ["confirmed", "reserved", "pending"] },
      checkIn: { $lte: endOfDay },
    };

    if (expressOnly === "true") {
      filter.checkInVerified = true;
    }

    const arrivals = await Booking.find(filter)
      .populate(
        "guestId",
        "name email phone nationality idType idNumber address",
      )
      .populate(
        "roomId",
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
          rx.test(b.roomId?.roomNumber || "")
        );
      })
      .map((b) => ({
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
        time: b.checkIn
          ? new Date(b.checkIn).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : null,
        room: b.roomId?.roomNumber ? `Room ${b.roomId.roomNumber}` : null,
        roomId: b.roomId?._id || null,
        roomType: b.roomTypeCode
          ? b.roomTypeCode.toUpperCase()
          : b.roomId?.type || null,
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
            Math.round((new Date(b.checkOut) - new Date(b.checkIn)) / 86400000),
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
      }));

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
      keyCardNumber,
      depositAmount = 0,
      paymentMode = "CASH",
      notes,
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

    const targetRoomId = roomId || booking.roomId;
    if (!targetRoomId) {
      return res.status(400).json({
        success: false,
        message: "Please assign a room before completing check-in",
      });
    }

    // Verify and claim the room
    const room = await Room.findOne({ _id: targetRoomId, hotelId });
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }

    const guestUser = await User.findById(booking.guestId).select("name phone");
    const guestName = guestUser?.name || "Valued Guest";

    await Room.findByIdAndUpdate(targetRoomId, {
      status: "occupied",
      currentGuest: guestName,
      checkIn: booking.checkIn || new Date(),
      checkOut: booking.checkOut || null,
    });

    const previousStatus = booking.status;
    booking.status = "checked-in";
    booking.roomId = targetRoomId;
    booking.checkInVerified = true;
    if (depositAmount > 0) {
      booking.pricing = booking.pricing || {};
      booking.paymentStatus = "partially-paid";
    }

    booking.auditTrail.push({
      at: new Date(),
      by: req.user._id,
      action: "checked-in",
      from: previousStatus,
      to: "checked-in",
      note: `Front desk check-in into Room ${room.roomNumber}. Deposit: ₹${depositAmount} (${paymentMode}). ${notes || ""}`,
    });

    await booking.save();

    // Assign Key Card if provided
    if (keyCardNumber?.trim()) {
      const cleanCardNo = keyCardNumber.trim().toUpperCase();
      let card = await KeyCard.findOne({ hotelId, cardNumber: cleanCardNo });
      if (!card) {
        card = new KeyCard({ hotelId, cardNumber: cleanCardNo });
      }
      card.status = "ACTIVE";
      card.currentBookingId = booking._id;
      card.assignedRoomId = targetRoomId;
      card.assignedGuestId = booking.guestId;
      card.issuedAt = new Date();
      card.expiresAt = booking.checkOut;
      card.auditLog.push({
        action: "ASSIGNED",
        performedBy: req.user._id,
        bookingId: booking._id,
        note: `Issued at Front Desk Check-in for Room ${room.roomNumber}`,
      });
      await card.save();
    }

    // Trigger Aiosell Inventory sync
    const [syncStart, syncEnd] = calculateSyncDateRange(
      booking.checkIn,
      booking.checkOut,
    );
    await aiosellSyncInventory(hotelId, syncStart, syncEnd);

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
