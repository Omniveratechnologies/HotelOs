import KeyCard from "../models/KeyCard.js";
import Booking from "#/modules/bookings/models/Booking.js";
import logger from "#/utils/logger.js";

// =====================================================
// LIST KEY CARDS
// =====================================================
export const getKeyCards = async (req, res) => {
  try {
    const { status, keyType, q, page = 1, limit = 50 } = req.query;
    const filter = { hotelId: req.user.hotelId };

    if (status && status !== "ALL") {
      filter.status = status;
    }
    if (keyType) {
      filter.keyType = keyType;
    }
    if (q?.trim()) {
      const rx = new RegExp(
        q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
      filter.cardNumber = rx;
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 50));

    const [cards, total] = await Promise.all([
      KeyCard.find(filter)
        .populate("assignedGuestId", "name phone email")
        .populate("assignedRoomId", "roomNumber type")
        .populate("currentBookingId", "reservationNo checkIn checkOut status")
        .sort({ updatedAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      KeyCard.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Key cards fetched",
      data: {
        cards,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    logger.error(error, "Get Key Cards Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch key cards" });
  }
};

// =====================================================
// KEY CARD STATS
// =====================================================
export const getKeyCardStats = async (req, res) => {
  try {
    const hotelId = req.user.hotelId;
    const [stats, reissuedTodayCount] = await Promise.all([
      KeyCard.aggregate([
        { $match: { hotelId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      (() => {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        return KeyCard.countDocuments({
          hotelId,
          "auditLog.action": "REISSUED",
          "auditLog.performedAt": { $gte: startOfToday },
        });
      })(),
    ]);

    const statusMap = Object.fromEntries(stats.map((s) => [s._id, s.count]));
    const total = Object.values(statusMap).reduce((a, b) => a + b, 0);

    return res.status(200).json({
      success: true,
      message: "Key card stats fetched",
      data: {
        total,
        active: statusMap.ACTIVE || 0,
        available: statusMap.AVAILABLE || 0,
        lost: statusMap.LOST || 0,
        damaged: statusMap.DAMAGED || 0,
        deactivated: statusMap.DEACTIVATED || 0,
        reissuedToday: reissuedTodayCount,
      },
    });
  } catch (error) {
    logger.error(error, "Get Key Card Stats Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch key card stats" });
  }
};

// =====================================================
// CREATE / REGISTER KEY CARD
// =====================================================
export const createKeyCard = async (req, res) => {
  try {
    const {
      cardNumber,
      keyType = "RFID_CARD",
      count = 1,
      prefix = "RC-2026-",
    } = req.body;

    // Batch creation
    if (count > 1) {
      const createdCards = [];
      for (let i = 0; i < count; i++) {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const cardNo = `${prefix}${randomNum}`;
        const existing = await KeyCard.findOne({
          hotelId: req.user.hotelId,
          cardNumber: cardNo,
        });
        if (!existing) {
          createdCards.push({
            hotelId: req.user.hotelId,
            cardNumber: cardNo,
            keyType,
            status: "AVAILABLE",
            auditLog: [
              {
                action: "CREATED",
                performedBy: req.user._id,
                note: "Batch registered",
              },
            ],
          });
        }
      }
      if (createdCards.length > 0) {
        await KeyCard.insertMany(createdCards);
      }
      return res.status(201).json({
        success: true,
        message: `${createdCards.length} key card(s) registered successfully`,
        data: createdCards,
      });
    }

    if (!cardNumber?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Card number is required" });
    }

    const cleanCardNo = cardNumber.trim().toUpperCase();
    const existing = await KeyCard.findOne({
      hotelId: req.user.hotelId,
      cardNumber: cleanCardNo,
    });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Card number already registered" });
    }

    const card = await KeyCard.create({
      hotelId: req.user.hotelId,
      cardNumber: cleanCardNo,
      keyType,
      status: "AVAILABLE",
      auditLog: [
        {
          action: "CREATED",
          performedBy: req.user._id,
          note: "Initial registration",
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Key card registered successfully",
      data: card,
    });
  } catch (error) {
    logger.error(error, "Create Key Card Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to register key card" });
  }
};

// =====================================================
// ASSIGN KEY CARD TO BOOKING & ROOM
// =====================================================
export const assignKeyCard = async (req, res) => {
  try {
    const { cardNumber, cardId, bookingId, roomId, guestId, notes } = req.body;

    let card = null;
    if (cardId) {
      card = await KeyCard.findOne({ _id: cardId, hotelId: req.user.hotelId });
    } else if (cardNumber) {
      card = await KeyCard.findOne({
        cardNumber: cardNumber.trim().toUpperCase(),
        hotelId: req.user.hotelId,
      });
    }

    if (!card) {
      return res
        .status(404)
        .json({ success: false, message: "Key card not found" });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      hotelId: req.user.hotelId,
    });
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    const assignedRoom = roomId || booking.roomId;
    const assignedGuest = guestId || booking.guestId;

    card.status = "ACTIVE";
    card.currentBookingId = booking._id;
    card.assignedRoomId = assignedRoom;
    card.assignedGuestId = assignedGuest;
    card.issuedAt = new Date();
    card.expiresAt = booking.checkOut || null;
    card.auditLog.push({
      action: "ASSIGNED",
      performedBy: req.user._id,
      bookingId: booking._id,
      note: notes || `Assigned to Room ${assignedRoom || "unassigned"}`,
    });

    await card.save();

    return res.status(200).json({
      success: true,
      message: `Card ${card.cardNumber} assigned successfully`,
      data: card,
    });
  } catch (error) {
    logger.error(error, "Assign Key Card Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to assign key card" });
  }
};

// =====================================================
// REISSUE KEY CARD
// =====================================================
export const reissueKeyCard = async (req, res) => {
  try {
    const { newCardNumber, reason } = req.body;
    const oldCard = await KeyCard.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    });

    if (!oldCard) {
      return res
        .status(404)
        .json({ success: false, message: "Original card not found" });
    }

    const bookingId = oldCard.currentBookingId;
    const roomId = oldCard.assignedRoomId;
    const guestId = oldCard.assignedGuestId;

    // Deactivate old card
    oldCard.status = "DEACTIVATED";
    oldCard.auditLog.push({
      action: "REISSUED",
      performedBy: req.user._id,
      bookingId,
      note: `Reissued replacement. Reason: ${reason || "Key replacement"}`,
    });
    await oldCard.save();

    // Create or claim new card
    let replacement = null;
    if (newCardNumber?.trim()) {
      const cleanNo = newCardNumber.trim().toUpperCase();
      replacement = await KeyCard.findOne({
        cardNumber: cleanNo,
        hotelId: req.user.hotelId,
      });
      if (!replacement) {
        replacement = new KeyCard({
          hotelId: req.user.hotelId,
          cardNumber: cleanNo,
          keyType: oldCard.keyType,
        });
      }
      replacement.status = "ACTIVE";
      replacement.currentBookingId = bookingId;
      replacement.assignedRoomId = roomId;
      replacement.assignedGuestId = guestId;
      replacement.issuedAt = new Date();
      replacement.expiresAt = oldCard.expiresAt;
      replacement.auditLog.push({
        action: "ASSIGNED",
        performedBy: req.user._id,
        bookingId,
        note: `Replacement for card ${oldCard.cardNumber}`,
      });
      await replacement.save();
    }

    return res.status(200).json({
      success: true,
      message: "Key card reissued successfully",
      data: { oldCard, replacement },
    });
  } catch (error) {
    logger.error(error, "Reissue Key Card Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to reissue key card" });
  }
};

// =====================================================
// BLOCK / REPORT LOST
// =====================================================
export const blockKeyCard = async (req, res) => {
  try {
    const { reason = "Reported Lost" } = req.body;
    const card = await KeyCard.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    });

    if (!card) {
      return res
        .status(404)
        .json({ success: false, message: "Key card not found" });
    }

    card.status = "LOST";
    card.auditLog.push({
      action: "BLOCKED",
      performedBy: req.user._id,
      bookingId: card.currentBookingId,
      note: reason,
    });
    await card.save();

    return res.status(200).json({
      success: true,
      message: `Card ${card.cardNumber} marked as LOST / blocked`,
      data: card,
    });
  } catch (error) {
    logger.error(error, "Block Key Card Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to block key card" });
  }
};

// =====================================================
// DEACTIVATE / RETURN CARD
// =====================================================
export const deactivateKeyCard = async (req, res) => {
  try {
    const card = await KeyCard.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    });

    if (!card) {
      return res
        .status(404)
        .json({ success: false, message: "Key card not found" });
    }

    const previousBooking = card.currentBookingId;
    card.status = "AVAILABLE";
    card.currentBookingId = null;
    card.assignedRoomId = null;
    card.assignedGuestId = null;
    card.issuedAt = null;
    card.expiresAt = null;
    card.auditLog.push({
      action: "RETURNED",
      performedBy: req.user._id,
      bookingId: previousBooking,
      note: "Card returned / reset to stock inventory",
    });
    await card.save();

    return res.status(200).json({
      success: true,
      message: `Card ${card.cardNumber} returned to stock inventory`,
      data: card,
    });
  } catch (error) {
    logger.error(error, "Deactivate Key Card Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to return key card" });
  }
};

// =====================================================
// DELETE KEY CARD
// =====================================================
export const deleteKeyCard = async (req, res) => {
  try {
    const card = await KeyCard.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    });

    if (!card) {
      return res
        .status(404)
        .json({ success: false, message: "Key card not found" });
    }

    if (card.status === "ACTIVE") {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete an actively assigned card. Return or deactivate it first.",
      });
    }

    await card.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Key card deleted from inventory",
    });
  } catch (error) {
    logger.error(error, "Delete Key Card Error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete key card" });
  }
};
