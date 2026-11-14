import Bill from "../models/Bill.js";
import Payment from "../models/Payment.js";
import Booking from "#/modules/bookings/models/Booking.js";
import Room from "#/modules/rooms/models/Room.js";
import logger from "#/utils/logger.js";

/**
 * Ensures an active, canonical Master Folio (Bill) exists for a given Booking.
 * If a folio already exists, updates assigned room and guest contact details.
 * If missing, constructs an itemized Master Folio derived from booking.pricing.
 *
 * @param {string|Object} bookingIdOrDoc
 * @returns {Promise<Object>} Mongoose Bill document
 */
export async function ensureFolioForBooking(bookingIdOrDoc) {
  let booking = bookingIdOrDoc;
  if (!booking || !booking._id || typeof booking.populate !== "function") {
    const bId = booking?._id || bookingIdOrDoc;
    booking = await Booking.findById(bId)
      .populate("guestId", "name email phone")
      .populate("roomId", "roomNumber type rate floor roomCode");
  }

  if (!booking) {
    logger.warn(
      { bookingId: bookingIdOrDoc },
      "Cannot ensure folio: Booking not found",
    );
    return null;
  }

  const hotelId = booking.hotelId;

  // 1. Check if a Bill already exists for this booking
  let bill = await Bill.findOne({
    bookingId: booking._id,
    hotelId,
  });

  // Resolve assigned Room & Room Number
  let roomNumber = null;
  let roomId = booking.roomId?._id || booking.roomId || null;

  if (
    Array.isArray(booking.roomAllocations) &&
    booking.roomAllocations.length > 0
  ) {
    const firstAlloc = booking.roomAllocations[0];
    if (
      firstAlloc.roomNumber &&
      !/^[0-9a-fA-F]{24}$/.test(firstAlloc.roomNumber)
    ) {
      roomNumber = firstAlloc.roomNumber;
    }
    if (firstAlloc.roomId) {
      roomId = firstAlloc.roomId._id || firstAlloc.roomId;
    }
  }

  if (!roomNumber && roomId) {
    const roomDoc = booking.roomId?.roomNumber
      ? booking.roomId
      : await Room.findById(roomId).select("roomNumber type").lean();
    if (roomDoc?.roomNumber) {
      roomNumber = roomDoc.roomNumber;
    }
  }

  if (!roomNumber) {
    roomNumber = "101";
  }

  const guestName =
    booking.guestId?.name ||
    booking.roomAllocations?.[0]?.occupantName ||
    "Guest";
  const guestPhone =
    booking.guestId?.phone || booking.roomAllocations?.[0]?.occupantPhone || "";
  const guestEmail =
    booking.guestId?.email || booking.roomAllocations?.[0]?.occupantEmail || "";

  if (bill) {
    // Synchronize room and guest info if changed
    let needsSave = false;
    if (roomId && String(bill.roomId) !== String(roomId)) {
      bill.roomId = roomId;
      needsSave = true;
    }
    if (guestName && bill.guestName !== guestName) {
      bill.guestName = guestName;
      needsSave = true;
    }
    if (guestPhone && bill.guestPhone !== guestPhone) {
      bill.guestPhone = guestPhone;
      needsSave = true;
    }
    if (guestEmail && bill.guestEmail !== guestEmail) {
      bill.guestEmail = guestEmail;
      needsSave = true;
    }
    if (needsSave) {
      await bill.save();
    }
    return bill;
  }

  // 2. Build initial itemized charges from canonical booking.pricing
  const checkIn = new Date(booking.checkIn);
  const checkOut = new Date(booking.checkOut);
  const nights =
    Math.max(
      1,
      Math.round(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
      ),
    ) || 1;

  const roomTypeCode = (
    booking.roomTypeCode ||
    booking.roomId?.type ||
    "Standard"
  ).toUpperCase();

  const pricing = booking.pricing || {};
  const nightlyRate =
    Number(
      pricing.nightlyRate ||
        booking.roomId?.rate ||
        Math.round(
          (pricing.taxableBase || pricing.roomCharge || 2999) / nights,
        ),
    ) || 2999;

  const items = [];

  if (
    Array.isArray(pricing.itemizedLines) &&
    pricing.itemizedLines.length > 0
  ) {
    pricing.itemizedLines.forEach((line) => {
      items.push({
        name: `Room Tariff - ${String(line.roomTypeCode || roomTypeCode).toUpperCase()} (${line.nights || nights}N)`,
        price: Number(line.nightlyRate || nightlyRate),
        quantity: Number((line.rooms || 1) * (line.nights || nights)),
        notes: `Stay from ${checkIn.toLocaleDateString("en-IN")} to ${checkOut.toLocaleDateString("en-IN")}`,
      });
    });
  } else {
    items.push({
      name: `Room Tariff - ${roomTypeCode} (${nights} Night${nights > 1 ? "s" : ""})`,
      price: nightlyRate,
      quantity: nights,
      notes: `Stay from ${checkIn.toLocaleDateString("en-IN")} to ${checkOut.toLocaleDateString("en-IN")}`,
    });
  }

  // Include add-ons if specified in pricing
  if (Array.isArray(pricing.addOns) && pricing.addOns.length > 0) {
    pricing.addOns.forEach((addOn) => {
      items.push({
        name: addOn.label || addOn.name || "Add-on Service",
        price: Number(addOn.amount || 0),
        quantity: Number(addOn.quantity || 1),
        notes: "Reservation Add-on",
      });
    });
  }

  const subtotal = Number(
    pricing.taxableBase ??
      pricing.roomCharge ??
      items.reduce((s, i) => s + i.price * i.quantity, 0),
  );

  const totalTax = Number(
    pricing.taxAmount ??
      Math.round(subtotal * ((pricing.taxPercent || 12) / 100)),
  );
  const cgst = Math.round(totalTax / 2);
  const sgst = totalTax - cgst;
  const totalAmount = Number(
    pricing.grandTotal ?? pricing.total ?? subtotal + totalTax,
  );

  const cleanSuffix = booking._id.toString().slice(-4).toUpperCase();
  const billNo = `FOL-${roomNumber}-${cleanSuffix}`;

  let status = "saved";
  if (booking.status === "checked-out" && booking.paymentStatus === "paid") {
    status = "paid";
  } else if (booking.status === "cancelled") {
    status = "cancelled";
  }

  let paymentStatus = "unpaid";
  if (booking.paymentStatus === "paid") {
    paymentStatus = "paid";
  } else if (booking.paymentStatus === "partially-paid") {
    paymentStatus = "partial";
  }

  bill = await Bill.create({
    billNo,
    hotelId,
    billType: "room-charge",
    roomId,
    bookingId: booking._id,
    guestName,
    guestPhone,
    guestEmail,
    items,
    subtotal,
    cgst,
    sgst,
    totalAmount,
    status,
    paymentStatus,
  });

  logger.info(
    { billId: bill._id, billNo, bookingId: booking._id, hotelId },
    "Created Master Folio for booking",
  );

  return bill;
}

/**
 * Records a payment against a Bill/Folio and updates its payment status.
 *
 * @param {string|mongoose.Types.ObjectId} billId
 * @param {Object} paymentInfo
 * @param {number} paymentInfo.amount
 * @param {string} [paymentInfo.method='cash']
 * @param {string} [paymentInfo.referenceNo='']
 * @param {string|mongoose.Types.ObjectId} [paymentInfo.userId=null]
 * @param {string} [paymentInfo.source='desk']
 * @returns {Promise<Object>} Created Payment document
 */
export async function recordFolioPayment(billId, paymentInfo) {
  const bill = await Bill.findById(billId);
  if (!bill) {
    throw new Error(`Cannot record payment: Bill ${billId} not found`);
  }

  const amount = Number(paymentInfo.amount || 0);
  if (amount <= 0) return null;

  const validMethods = [
    "cash",
    "card",
    "upi",
    "netbanking",
    "wallet",
    "room",
    "split",
    "complimentary",
  ];
  const rawMethod = String(paymentInfo.method || "cash").toLowerCase();
  const method = validMethods.includes(rawMethod) ? rawMethod : "cash";

  const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const payment = await Payment.create({
    transactionId,
    hotelId: bill.hotelId,
    billId: bill._id,
    method,
    amount,
    referenceNo: paymentInfo.referenceNo || `PAY-${bill.billNo}`,
    status: "success",
    source: paymentInfo.source || "desk",
  });

  // Calculate total payments recorded for this bill
  const payments = await Payment.find({
    billId: bill._id,
    hotelId: bill.hotelId,
    status: "success",
  }).lean();

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalAmount = Number(bill.totalAmount || 0);

  if (totalPaid >= totalAmount && totalAmount > 0) {
    bill.paymentStatus = "paid";
    bill.status = "paid";
  } else if (totalPaid > 0) {
    bill.paymentStatus = "partial";
  }

  await bill.save();

  logger.info(
    { paymentId: payment._id, billId: bill._id, amount, method },
    "Recorded payment on Master Folio",
  );

  return payment;
}

/**
 * Settles and closes an active Folio during guest checkout.
 *
 * @param {string|mongoose.Types.ObjectId} bookingId
 * @param {Object} options
 * @param {string} [options.settlementMode='cash']
 * @param {number} [options.amount]
 * @param {string|mongoose.Types.ObjectId} [options.userId]
 * @param {string} [options.notes='']
 * @returns {Promise<Object>} Settled Bill
 */
export async function settleAndCloseFolio(bookingId, options = {}) {
  const bill = await ensureFolioForBooking(bookingId);
  if (!bill) return null;

  const payments = await Payment.find({
    billId: bill._id,
    hotelId: bill.hotelId,
    status: "success",
  }).lean();

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalAmount = Number(bill.totalAmount || 0);
  const outstanding = Math.max(0, totalAmount - totalPaid);

  const settlementAmount =
    options.amount != null ? Number(options.amount) : outstanding;

  if (settlementAmount > 0) {
    await recordFolioPayment(bill._id, {
      amount: settlementAmount,
      method: options.settlementMode || "cash",
      referenceNo: `CHKOUT-${bill.billNo}`,
      userId: options.userId,
      source: "desk",
    });
  }

  bill.status = "paid";
  bill.paymentStatus = "paid";
  await bill.save();

  logger.info(
    { billId: bill._id, bookingId, settlementAmount },
    "Settled and closed Master Folio on checkout",
  );

  return bill;
}

export default {
  ensureFolioForBooking,
  recordFolioPayment,
  settleAndCloseFolio,
};
