import Bill from "../models/Bill.js";
import Payment from "../models/Payment.js";
import Refund from "../models/Refund.js";
import KOT from "../models/KOT.js";
import Charge from "../models/Charge.js";
import Coupon from "../models/Coupon.js";
import BillingSettings from "../models/BillingSettings.js";
import BillingWorkflow from "../models/BillingWorkflow.js";
import FoodItem from "#/modules/food-items/models/FoodItem.js";
import {
  billDTO,
  paymentDTO,
  refundDTO,
  kotDTO,
  chargeDTO,
  couponDTO,
  billingSettingsDTO,
} from "../dto/billing.dto.js";
import { emitToHotel } from "#/shared/services/socket.service.js";
import { SOCKET_EVENTS } from "#/config/socket-events.js";
import logger from "#/utils/logger.js";

import Table from "#/modules/tables/models/Table.js";
import Room from "#/modules/rooms/models/Room.js";

const seq = (prefix) => `${prefix}${Date.now().toString().slice(-8)}`;

// ---------- BILLS ----------
export const createBill = async (req, res) => {
  try {
    const {
      billType,
      tableId,
      roomId,
      guestName,
      guestPhone,
      guestEmail,
      items,
    } = req.body;
    if (!items?.length)
      return res
        .status(400)
        .json({ success: false, message: "items are required" });

    const foodItems = await FoodItem.find({
      _id: { $in: items.filter((i) => i.foodItemId).map((i) => i.foodItemId) },
    });
    const billItems = items.map((i) => {
      const match = foodItems.find((f) => f._id.toString() === i.foodItemId);
      return {
        foodItemId: match?._id || null,
        name: i.name || match?.name,
        price: i.price ?? match?.price ?? 0,
        quantity: i.quantity || 1,
        kitchenStation: match?.kitchenStation || "Main Kitchen",
        notes: i.notes || "",
      };
    });
    const subtotal = billItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0,
    );

    const bill = await Bill.create({
      billNo: seq("INV-"),
      hotelId: req.user.hotelId,
      billType,
      tableId,
      roomId,
      guestName,
      guestPhone,
      guestEmail,
      items: billItems,
      subtotal,
      totalAmount: subtotal,
      status: "draft",
      cashierId: req.user._id,
    });

    return res.status(201).json({ success: true, data: billDTO(bill) });
  } catch (error) {
    logger.error(error, "Create bill error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to create bill" });
  }
};

export const saveBill = async (req, res) => {
  try {
    const bill = await Bill.findOneAndUpdate(
      { _id: req.params.id, hotelId: req.user.hotelId },
      { $set: { ...req.body, status: "saved" } },
      { new: true },
    );
    if (!bill)
      return res
        .status(404)
        .json({ success: false, message: "Bill not found" });

    // Auto-generate a KOT per kitchen station present in this bill.
    const stations = [...new Set(bill.items.map((i) => i.kitchenStation))];
    for (const station of stations) {
      const stationItems = bill.items.filter(
        (i) => i.kitchenStation === station,
      );
      const kot = await KOT.create({
        kotNo: seq("K"),
        hotelId: bill.hotelId,
        billId: bill._id,
        tableId: bill.tableId,
        roomId: bill.roomId,
        station,
        items: stationItems.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          notes: i.notes,
          status: "preparing",
        })),
      });
      emitToHotel(bill.hotelId, SOCKET_EVENTS.ORDER_UPDATED, kotDTO(kot));
    }

    return res.status(200).json({ success: true, data: billDTO(bill) });
  } catch (error) {
    logger.error(error, "Save bill error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to save bill" });
  }
};

export const listBills = async (req, res) => {
  try {
    const { status, billType } = req.query;
    const filter = { hotelId: req.user.hotelId };
    if (status) filter.status = status;
    if (billType) filter.billType = billType;
    const bills = await Bill.find(filter).sort({ createdAt: -1 }).limit(200);
    return res.status(200).json({ success: true, data: bills.map(billDTO) });
  } catch (error) {
    logger.error(error, "List bills error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch bills" });
  }
};

export const getBill = async (req, res) => {
  try {
    const bill = await Bill.findOne({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    });
    if (!bill)
      return res
        .status(404)
        .json({ success: false, message: "Bill not found" });
    return res.status(200).json({ success: true, data: billDTO(bill) });
  } catch (error) {
    logger.error(error, "Get bill error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch bill" });
  }
};

export const cancelBill = async (req, res) => {
  try {
    const bill = await Bill.findOneAndUpdate(
      { _id: req.params.id, hotelId: req.user.hotelId },
      { $set: { status: "cancelled" } },
      { new: true },
    );
    if (!bill)
      return res
        .status(404)
        .json({ success: false, message: "Bill not found" });
    return res.status(200).json({ success: true, data: billDTO(bill) });
  } catch (error) {
    logger.error(error, "Cancel bill error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to cancel bill" });
  }
};

export const listRoomsLookup = async (req, res) => {
  try {
    const rooms = await Room.find({ hotelId: req.user.hotelId })
      .select("roomNumber status")
      .sort({ roomNumber: 1 });
    return res
      .status(200)
      .json({
        success: true,
        data: rooms.map((r) => ({
          id: r._id,
          roomNumber: r.roomNumber,
          status: r.status,
        })),
      });
  } catch (error) {
    logger.error(error, "List rooms lookup error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch rooms" });
  }
};

// ---------- ROOM CHARGES ----------
export const listRoomCharges = async (req, res) => {
  try {
    const bills = await Bill.find({
      hotelId: req.user.hotelId,
      billType: "room-charge",
    }).sort({ createdAt: -1 });
    const roomIds = [...new Set(bills.map((b) => b.roomId?.toString()))].filter(
      Boolean,
    );
    const rooms = roomIds.length
      ? await Room.find({ _id: { $in: roomIds } }).select("roomNumber")
      : [];
    const roomMap = new Map(rooms.map((r) => [r._id.toString(), r]));
    const data = bills.map((b) => ({
      ...billDTO(b),
      roomNumber: roomMap.get(b.roomId?.toString())?.roomNumber || null,
    }));
    return res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error(error, "List room charges error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch room charges" });
  }
};

export const addRoomCharge = async (req, res) => {
  try {
    const { roomId, bookingId, guestName, items } = req.body;
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const bill = await Bill.create({
      billNo: seq("RC-"),
      hotelId: req.user.hotelId,
      billType: "room-charge",
      roomId,
      bookingId,
      guestName,
      items,
      subtotal,
      totalAmount: subtotal,
      status: "saved",
      paymentStatus: "unpaid",
      cashierId: req.user._id,
    });
    return res.status(201).json({ success: true, data: billDTO(bill) });
  } catch (error) {
    logger.error(error, "Add room charge error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to add room charge" });
  }
};

export const settleRoomCharge = async (req, res) => {
  try {
    const bill = await Bill.findOneAndUpdate(
      { _id: req.params.id, hotelId: req.user.hotelId },
      { $set: { paymentStatus: "paid", status: "paid" } },
      { new: true },
    );
    if (!bill)
      return res
        .status(404)
        .json({ success: false, message: "Bill not found" });
    return res.status(200).json({ success: true, data: billDTO(bill) });
  } catch (error) {
    logger.error(error, "Settle room charge error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to settle room charge" });
  }
};

// ---------- PAYMENTS ----------
export const createPayment = async (req, res) => {
  try {
    const {
      billId,
      method,
      amount,
      referenceNo,
      splitPayments,
      notes,
      source = "desk",
      idempotencyKey,
      cashierShiftId,
    } = req.body;
    const bill = await Bill.findOne({ _id: billId, hotelId: req.user.hotelId });
    if (!bill)
      return res
        .status(404)
        .json({ success: false, message: "Bill not found" });
    if (idempotencyKey) {
      const existing = await Payment.findOne({
        hotelId: req.user.hotelId,
        idempotencyKey,
      });
      if (existing)
        return res
          .status(200)
          .json({ success: true, data: paymentDTO(existing), duplicate: true });
    }
    const paid = await Payment.aggregate([
      {
        $match: {
          billId: bill._id,
          hotelId: req.user.hotelId,
          status: "success",
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const balance = Math.max(
      Number(bill.totalAmount || 0) - Number(paid[0]?.total || 0),
      0,
    );
    if (!amount || Number(amount) > balance)
      return res
        .status(400)
        .json({ success: false, message: "Payment exceeds the folio balance" });
    const isGateway = method === "wallet";
    if (method === "cash") {
      if (!cashierShiftId)
        return res
          .status(400)
          .json({
            success: false,
            message: "An open cashier shift is required for cash payments",
          });
      const shift = await BillingWorkflow.findOne({
        _id: cashierShiftId,
        hotelId: req.user.hotelId,
        type: "cashier-shift",
        status: "open",
      });
      if (!shift)
        return res
          .status(409)
          .json({ success: false, message: "Cashier shift is not open" });
    }

    const payment = await Payment.create({
      transactionId: seq("PAY"),
      hotelId: req.user.hotelId,
      billId,
      billNo: bill.billNo,
      method,
      amount,
      referenceNo,
      splitPayments: splitPayments || [],
      staffId: req.user._id,
      notes,
      source,
      status: isGateway ? "pending" : "success",
      idempotencyKey,
      cashierShiftId,
      businessDate: new Date(),
    });

    if (!isGateway) {
      const nextPaid = Number(paid[0]?.total || 0) + Number(amount);
      bill.paymentStatus =
        nextPaid >= Number(bill.totalAmount || 0) ? "paid" : "partial";
      bill.status = bill.paymentStatus === "paid" ? "paid" : bill.status;
    } else {
      bill.paymentStatus = "partial";
    }
    await bill.save();

    return res.status(201).json({ success: true, data: paymentDTO(payment) });
  } catch (error) {
    logger.error(error, "Create payment error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to record payment" });
  }
};

export const listPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ hotelId: req.user.hotelId })
      .sort({ createdAt: -1 })
      .limit(200);
    return res
      .status(200)
      .json({ success: true, data: payments.map(paymentDTO) });
  } catch (error) {
    logger.error(error, "List payments error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch payments" });
  }
};

export const retryPayment = async (req, res) => {
  const payment = await Payment.findOne({
    _id: req.params.id,
    hotelId: req.user.hotelId,
  });
  if (!payment)
    return res
      .status(404)
      .json({ success: false, message: "Payment not found" });
  if (payment.status !== "failed")
    return res
      .status(409)
      .json({ success: false, message: "Only failed payments can be retried" });
  payment.status = "pending";
  payment.source = "online";
  await payment.save();
  return res.json({ success: true, data: paymentDTO(payment) });
};

export const sendPaymentLink = async (req, res) => {
  const payment = await Payment.findOne({
    _id: req.params.id,
    hotelId: req.user.hotelId,
  });
  if (!payment)
    return res
      .status(404)
      .json({ success: false, message: "Payment not found" });
  return res
    .status(202)
    .json({
      success: true,
      data: { paymentId: payment._id, status: "link_queued" },
    });
};

// ---------- REFUNDS ----------
export const createRefund = async (req, res) => {
  try {
    const { billId, paymentId, amount, reason, paymentMethod, notes } =
      req.body;
    const bill = await Bill.findOne({ _id: billId, hotelId: req.user.hotelId });
    const payment = await Payment.findOne({
      _id: paymentId,
      billId,
      hotelId: req.user.hotelId,
    });
    if (!payment)
      return res
        .status(404)
        .json({ success: false, message: "Original payment not found" });
    const previousRefunds = await Refund.aggregate([
      {
        $match: {
          paymentId: payment._id,
          hotelId: req.user.hotelId,
          status: { $in: ["pending", "completed"] },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const refundable = Math.max(
      Number(payment.amount || 0) - Number(previousRefunds[0]?.total || 0),
      0,
    );
    if (!amount || Number(amount) > refundable)
      return res
        .status(400)
        .json({
          success: false,
          message: "Refund exceeds refundable payment balance",
        });
    const refund = await Refund.create({
      refundId: seq("RF"),
      hotelId: req.user.hotelId,
      billId,
      billNo: bill?.billNo || "",
      paymentId,
      amount,
      reason,
      paymentMethod,
      notes,
      requestedById: req.user._id,
      status: "pending",
    });
    return res.status(201).json({ success: true, data: refundDTO(refund) });
  } catch (error) {
    logger.error(error, "Create refund error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to create refund" });
  }
};

export const listRefunds = async (req, res) => {
  try {
    const refunds = await Refund.find({ hotelId: req.user.hotelId }).sort({
      createdAt: -1,
    });
    return res
      .status(200)
      .json({ success: true, data: refunds.map(refundDTO) });
  } catch (error) {
    logger.error(error, "List refunds error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch refunds" });
  }
};

export const decideRefund = async (req, res) => {
  try {
    const { decision } = req.body; // "approve" | "reject"
    const refund = await Refund.findOneAndUpdate(
      { _id: req.params.id, hotelId: req.user.hotelId },
      {
        $set: {
          status: decision === "approve" ? "completed" : "rejected",
          approvedById: req.user._id,
        },
      },
      { new: true },
    );
    if (!refund)
      return res
        .status(404)
        .json({ success: false, message: "Refund not found" });
    return res.status(200).json({ success: true, data: refundDTO(refund) });
  } catch (error) {
    logger.error(error, "Decide refund error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to update refund" });
  }
};

// ---------- KOT ----------
export const listKots = async (req, res) => {
  try {
    const kots = await KOT.find({ hotelId: req.user.hotelId })
      .sort({ createdAt: -1 })
      .limit(300);
    const tableIds = [
      ...new Set(kots.map((k) => k.tableId?.toString())),
    ].filter(Boolean);
    const roomIds = [...new Set(kots.map((k) => k.roomId?.toString()))].filter(
      Boolean,
    );
    const tables = tableIds.length
      ? await Table.find({ _id: { $in: tableIds } }).select("tableNumber")
      : [];
    const rooms = roomIds.length
      ? await Room.find({ _id: { $in: roomIds } }).select("roomNumber")
      : [];
    const tableMap = new Map(tables.map((t) => [t._id.toString(), t]));
    const roomMap = new Map(rooms.map((r) => [r._id.toString(), r]));
    const data = kots.map((k) =>
      kotDTO(
        k,
        tableMap.get(k.tableId?.toString()),
        roomMap.get(k.roomId?.toString()),
      ),
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error(error, "List KOTs error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch KOTs" });
  }
};

export const updateKotStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const kot = await KOT.findOneAndUpdate(
      { _id: req.params.id, hotelId: req.user.hotelId },
      { $set: { status }, $push: { timeline: { event: status } } },
      { new: true },
    );
    if (!kot)
      return res.status(404).json({ success: false, message: "KOT not found" });
    emitToHotel(kot.hotelId, SOCKET_EVENTS.ORDER_UPDATED, kotDTO(kot));
    return res.status(200).json({ success: true, data: kotDTO(kot) });
  } catch (error) {
    logger.error(error, "Update KOT error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to update KOT" });
  }
};

// ---------- CHARGES (generic CRUD) ----------
function crud(Model, dto, label) {
  return {
    list: async (req, res) => {
      const rows = await Model.find({ hotelId: req.user.hotelId });
      return res.status(200).json({ success: true, data: rows.map(dto) });
    },
    create: async (req, res) => {
      const row = await Model.create({
        ...req.body,
        hotelId: req.user.hotelId,
      });
      return res
        .status(201)
        .json({ success: true, message: `${label} created`, data: dto(row) });
    },
    update: async (req, res) => {
      const row = await Model.findOneAndUpdate(
        { _id: req.params.id, hotelId: req.user.hotelId },
        { $set: req.body },
        { new: true },
      );
      if (!row)
        return res
          .status(404)
          .json({ success: false, message: `${label} not found` });
      return res.status(200).json({ success: true, data: dto(row) });
    },
    remove: async (req, res) => {
      const row = await Model.findOneAndDelete({
        _id: req.params.id,
        hotelId: req.user.hotelId,
      });
      if (!row)
        return res
          .status(404)
          .json({ success: false, message: `${label} not found` });
      return res
        .status(200)
        .json({ success: true, message: `${label} deleted` });
    },
  };
}
export const chargeCrud = crud(Charge, chargeDTO, "Charge");
export const couponCrud = crud(Coupon, couponDTO, "Coupon");

// ---------- BILLING SETTINGS (singleton) ----------
export const getBillingSettings = async (req, res) => {
  try {
    let settings = await BillingSettings.findOne({ hotelId: req.user.hotelId });
    if (!settings)
      settings = await BillingSettings.create({ hotelId: req.user.hotelId });
    return res
      .status(200)
      .json({ success: true, data: billingSettingsDTO(settings) });
  } catch (error) {
    logger.error(error, "Get billing settings error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch billing settings" });
  }
};

export const updateBillingSettings = async (req, res) => {
  try {
    const settings = await BillingSettings.findOneAndUpdate(
      { hotelId: req.user.hotelId },
      { $set: req.body },
      { new: true, upsert: true },
    );
    return res
      .status(200)
      .json({ success: true, data: billingSettingsDTO(settings) });
  } catch (error) {
    logger.error(error, "Update billing settings error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to update billing settings" });
  }
};
