import Booking from "#/modules/bookings/models/Booking.js";
import Room from "#/modules/rooms/models/Room.js";
import FolioTransaction from "../models/FolioTransaction.js";

const decimal = (value) => String(value ?? 0);
const publicTransaction = (transaction) => ({
  id: transaction._id,
  folioTransactionId: `FTX-${transaction._id.toString().slice(-8).toUpperCase()}`,
  status: transaction.status,
  total: transaction.total?.toString(),
  currency: transaction.currency,
});

export const lookupCurrentGuest = async (req, res) => {
  const room = await Room.findOne({
    hotelId: req.user.hotelId,
    roomNumber: String(req.params.roomNumber).trim(),
  }).lean();
  if (!room)
    return res.status(404).json({ success: false, message: "Room not found" });
  if (room.status !== "occupied") {
    return res
      .status(409)
      .json({ success: false, message: "Room is not occupied" });
  }

  const booking = await Booking.findOne({
    hotelId: req.user.hotelId,
    roomId: room._id,
    status: "checked-in",
  }).populate("guestId", "name email phone");
  if (!booking?.guestId) {
    return res
      .status(404)
      .json({ success: false, message: "No active guest found for this room" });
  }

  return res.json({
    success: true,
    data: {
      hotelId: req.user.hotelId,
      roomId: room._id,
      roomNumber: room.roomNumber,
      guestId: booking.guestId._id,
      reservationId: booking._id,
      folioId: booking._id,
      guestName: booking.guestId.name,
      allowRoomCharge: true,
    },
  });
};

export const postFolioCharge = async (req, res) => {
  const {
    outletId = "RESTAURANT",
    source = "RESTAURANT_POS",
    externalBillId,
    roomNumber,
    subtotal = 0,
    tax = 0,
    discount = 0,
    total = 0,
    currency = "INR",
    items = [],
  } = req.body;
  if (!externalBillId || !roomNumber) {
    return res
      .status(400)
      .json({
        success: false,
        message: "externalBillId and roomNumber are required",
      });
  }

  const existing = await FolioTransaction.findOne({
    hotelId: req.user.hotelId,
    source,
    outletId,
    sourceBillId: externalBillId,
  });
  if (existing)
    return res.json({
      success: true,
      data: publicTransaction(existing),
      idempotent: true,
    });

  const room = await Room.findOne({
    hotelId: req.user.hotelId,
    roomNumber: String(roomNumber).trim(),
    status: "occupied",
  });
  if (!room)
    return res
      .status(409)
      .json({ success: false, message: "Room is not occupied" });

  const booking = await Booking.findOne({
    hotelId: req.user.hotelId,
    roomId: room._id,
    status: "checked-in",
  });
  if (!booking?.guestId) {
    return res
      .status(409)
      .json({
        success: false,
        message: "No active reservation or guest found",
      });
  }

  const transaction = await FolioTransaction.create({
    hotelId: req.user.hotelId,
    roomId: room._id,
    reservationId: booking._id,
    guestId: booking.guestId,
    source,
    outletId,
    sourceBillId: externalBillId,
    items,
    subtotal: decimal(subtotal),
    tax: decimal(tax),
    discount: decimal(discount),
    total: decimal(total),
    currency,
    postedBy: req.user._id,
  });
  return res
    .status(201)
    .json({ success: true, data: publicTransaction(transaction) });
};

export const reverseFolioCharge = async (req, res) => {
  const original = await FolioTransaction.findOne({
    _id: req.params.id,
    hotelId: req.user.hotelId,
    transactionType: "CHARGE",
    status: "POSTED",
  });
  if (!original)
    return res
      .status(404)
      .json({ success: false, message: "Posted folio charge not found" });

  const reversal = await FolioTransaction.create({
    hotelId: original.hotelId,
    roomId: original.roomId,
    reservationId: original.reservationId,
    guestId: original.guestId,
    source: original.source,
    outletId: original.outletId,
    sourceBillId: `${original.sourceBillId}:REVERSAL`,
    transactionType: "REVERSAL",
    originalTransactionId: original._id,
    items: original.items,
    subtotal: `-${original.subtotal.toString()}`,
    tax: `-${original.tax.toString()}`,
    discount: original.discount,
    total: `-${original.total.toString()}`,
    currency: original.currency,
    postedBy: req.user._id,
  });
  original.status = "REVERSED";
  await original.save();
  return res.json({ success: true, data: publicTransaction(reversal) });
};
