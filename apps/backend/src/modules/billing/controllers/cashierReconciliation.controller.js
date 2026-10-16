import BillingWorkflow from "../models/BillingWorkflow.js";
import BillingEntity from "../models/BillingEntity.js";
import Payment from "../models/Payment.js";
import Refund from "../models/Refund.js";

const amount = (value) => Number(value || 0);
const entity = (row) => ({
  ...row.data,
  id: row._id,
  amount: amount(row.amount),
  status: row.status,
  createdAt: row.createdAt,
});
const cashPayments = (payments) =>
  payments
    .filter((row) => row.method === "cash" && row.status === "success")
    .reduce((sum, row) => sum + amount(row.amount), 0);

export const currentCashier = async (req, res) => {
  const shift = await BillingWorkflow.findOne({
    hotelId: req.user.hotelId,
    type: "cashier-shift",
    status: "open",
  })
    .sort({ createdAt: -1 })
    .lean();
  if (!shift)
    return res.json({
      success: true,
      data: { shift: null, movements: [], transactions: [] },
    });
  const [movements, payments] = await Promise.all([
    BillingEntity.find({
      hotelId: req.user.hotelId,
      entityType: "cash-movement",
      "data.shiftId": shift._id,
    })
      .sort({ createdAt: -1 })
      .lean(),
    Payment.find({
      hotelId: req.user.hotelId,
      createdAt: { $gte: shift.createdAt },
    })
      .sort({ createdAt: -1 })
      .limit(250)
      .lean(),
  ]);
  return res.json({
    success: true,
    data: { shift, movements: movements.map(entity), transactions: payments },
  });
};

export const cashierSummary = async (req, res) => {
  const since = new Date(req.query.date || new Date().setHours(0, 0, 0, 0));
  const [payments, refunds, shift] = await Promise.all([
    Payment.find({
      hotelId: req.user.hotelId,
      createdAt: { $gte: since },
    }).lean(),
    Refund.find({
      hotelId: req.user.hotelId,
      createdAt: { $gte: since },
    }).lean(),
    BillingWorkflow.findOne({
      hotelId: req.user.hotelId,
      type: "cashier-shift",
      status: "open",
    })
      .sort({ createdAt: -1 })
      .lean(),
  ]);
  const successful = payments.filter((row) => row.status === "success");
  const methods = ["cash", "card", "upi", "netbanking"].map((method) => ({
    method,
    amount: successful
      .filter((row) => row.method === method)
      .reduce((sum, row) => sum + amount(row.amount), 0),
    count: successful.filter((row) => row.method === method).length,
  }));
  const movements = shift
    ? await BillingEntity.find({
        hotelId: req.user.hotelId,
        entityType: "cash-movement",
        "data.shiftId": shift._id,
      }).lean()
    : [];
  const cashIn = movements
    .filter((row) => ["in", "pay-in"].includes(row.data?.type))
    .reduce((sum, row) => sum + amount(row.amount), 0);
  const cashOut = movements
    .filter((row) =>
      ["out", "pay-out", "petty", "deposit"].includes(row.data?.type),
    )
    .reduce((sum, row) => sum + amount(row.amount), 0);
  return res.json({
    success: true,
    data: {
      metrics: {
        total: successful.reduce((sum, row) => sum + amount(row.amount), 0),
        card: methods[1].amount,
        upi: methods[2].amount,
        cash: methods[0].amount,
        refunds: refunds.reduce((sum, row) => sum + amount(row.amount), 0),
      },
      methods,
      shift: shift
        ? {
            ...shift,
            currentCash:
              amount(shift.openingFloat) +
              cashPayments(successful) +
              cashIn -
              cashOut,
            cashIn,
            cashOut,
          }
        : null,
      transactions: successful,
      refunds,
    },
  });
};

export const createCashEntry = async (req, res) => {
  const shift = await BillingWorkflow.findOne({
    _id: req.body.shiftId,
    hotelId: req.user.hotelId,
    type: "cashier-shift",
    status: "open",
  });
  if (!shift)
    return res
      .status(409)
      .json({ success: false, message: "An open cashier shift is required" });
  if (amount(req.body.amount) <= 0)
    return res
      .status(400)
      .json({
        success: false,
        message: "Cash entry amount must be greater than zero",
      });
  const row = await BillingEntity.create({
    hotelId: req.user.hotelId,
    entityType: "cash-movement",
    status: "posted",
    amount: amount(req.body.amount),
    reference: req.body.reason || `CASH-${Date.now()}`,
    data: { ...req.body, shiftId: shift._id },
    createdBy: req.user._id,
  });
  return res.status(201).json({ success: true, data: entity(row.toObject()) });
};

export const recordCashCount = async (req, res) => {
  const shift = await BillingWorkflow.findOne({
    _id: req.body.shiftId,
    hotelId: req.user.hotelId,
    type: "cashier-shift",
    status: "open",
  });
  if (!shift)
    return res
      .status(404)
      .json({ success: false, message: "Open cashier shift not found" });
  const row = await BillingEntity.create({
    hotelId: req.user.hotelId,
    entityType: "cash-count",
    status: "recorded",
    amount: amount(req.body.total),
    data: { ...req.body, shiftId: shift._id },
    createdBy: req.user._id,
  });
  return res.status(201).json({ success: true, data: entity(row.toObject()) });
};

export const listCashierTransactions = async (req, res) => {
  const rows = await Payment.find({ hotelId: req.user.hotelId })
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
  return res.json({ success: true, data: rows });
};

export const reconciliationSummary = async (req, res) => {
  const [payments, external, discrepancies] = await Promise.all([
    Payment.find({ hotelId: req.user.hotelId })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean(),
    BillingEntity.find({
      hotelId: req.user.hotelId,
      entityType: "external-transaction",
    })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean(),
    BillingEntity.find({
      hotelId: req.user.hotelId,
      entityType: "reconciliation-discrepancy",
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
  ]);
  const system = payments
    .filter((row) => row.status === "success")
    .reduce((sum, row) => sum + amount(row.amount), 0);
  const deposits = external.reduce((sum, row) => sum + amount(row.amount), 0);
  const matched = Math.max(0, payments.length - discrepancies.length);
  const methods = ["cash", "card", "upi", "netbanking", "online"].map(
    (method) => {
      const systemAmount = payments
        .filter(
          (row) =>
            row.status === "success" &&
            (row.method === method ||
              (method === "online" && row.method === "wallet")),
        )
        .reduce((sum, row) => sum + amount(row.amount), 0);
      const bankAmount = external
        .filter(
          (row) => row.data?.method === method || row.data?.source === method,
        )
        .reduce((sum, row) => sum + amount(row.amount), 0);
      return {
        method,
        system: systemAmount,
        bank: bankAmount,
        variance: systemAmount - bankAmount,
      };
    },
  );
  return res.json({
    success: true,
    data: {
      metrics: {
        systemRevenue: system,
        bankDeposits: deposits,
        expectedDeposits: system,
        variance: system - deposits,
        reconciled: matched,
        total: payments.length,
        reconciledPercent: payments.length
          ? Math.round((matched / payments.length) * 100)
          : 100,
      },
      methods,
      status: {
        matched,
        pending: Math.max(0, payments.length - matched - discrepancies.length),
        discrepancy: discrepancies.length,
      },
      transactions: payments,
      discrepancies: discrepancies.map(entity),
      bank: [],
    },
  });
};

export const importReconciliation = async (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  const created = await BillingEntity.insertMany(
    rows.map((row) => ({
      hotelId: req.user.hotelId,
      entityType: "external-transaction",
      status: "pending",
      amount: amount(row.amount),
      reference: row.reference || "",
      data: { ...row, importedAt: new Date() },
      createdBy: req.user._id,
    })),
  );
  return res
    .status(201)
    .json({ success: true, data: { imported: created.length } });
};

export const runReconciliationJob = async (req, res) => {
  const run = await BillingWorkflow.create({
    hotelId: req.user.hotelId,
    type: "reconciliation",
    status: "completed",
    businessDate: req.body.businessDate || new Date(),
    payload: { ...req.body, completedAt: new Date() },
    openedBy: req.user._id,
  });
  return res.status(201).json({ success: true, data: run });
};

export const resolveDiscrepancy = async (req, res) => {
  const row = await BillingEntity.findOneAndUpdate(
    {
      _id: req.params.id,
      hotelId: req.user.hotelId,
      entityType: "reconciliation-discrepancy",
    },
    {
      $set: {
        status: "matched",
        "data.resolutionNote": req.body.note,
        "data.resolvedBy": req.user._id,
        "data.resolvedAt": new Date(),
      },
    },
    { new: true },
  ).lean();
  if (!row)
    return res
      .status(404)
      .json({ success: false, message: "Discrepancy not found" });
  return res.json({ success: true, data: entity(row) });
};

export const lockReconciliation = async (req, res) => {
  const row = await BillingEntity.create({
    hotelId: req.user.hotelId,
    entityType: "reconciliation-lock",
    status: "locked",
    reference: String(req.body.businessDate || new Date()),
    data: {
      businessDate: req.body.businessDate || new Date(),
      lockedBy: req.user._id,
    },
    createdBy: req.user._id,
  });
  return res.status(201).json({ success: true, data: entity(row.toObject()) });
};
