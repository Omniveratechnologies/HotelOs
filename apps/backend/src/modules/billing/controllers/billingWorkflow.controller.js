import BillingWorkflow from "../models/BillingWorkflow.js";
import Payment from "../models/Payment.js";
import BillingEntity from "../models/BillingEntity.js";

export const openCashierShift = async (req, res) => {
  const existing = await BillingWorkflow.findOne({
    hotelId: req.user.hotelId,
    type: "cashier-shift",
    status: "open",
  });
  if (existing)
    return res.status(409).json({
      success: false,
      message: "A cashier shift is already open",
      data: existing,
    });
  const shift = await BillingWorkflow.create({
    hotelId: req.user.hotelId,
    type: "cashier-shift",
    openingFloat: Number(req.body.openingFloat || 0),
    businessDate: req.body.businessDate || new Date(),
    openedBy: req.user._id,
  });
  return res.status(201).json({ success: true, data: shift });
};

export const closeCashierShift = async (req, res) => {
  const shift = await BillingWorkflow.findOne({
    _id: req.params.id,
    hotelId: req.user.hotelId,
    type: "cashier-shift",
    status: "open",
  });
  if (!shift)
    return res
      .status(404)
      .json({ success: false, message: "Open cashier shift not found" });

  const [payments, movements] = await Promise.all([
    Payment.find({
      hotelId: req.user.hotelId,
      createdAt: { $gte: shift.createdAt },
      status: "success",
      method: "cash",
    }).lean(),
    BillingEntity.find({
      hotelId: req.user.hotelId,
      entityType: "cash-movement",
      "data.shiftId": shift._id,
    }).lean(),
  ]);

  const cashCollected = payments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0,
  );
  const cashIn = movements
    .filter((m) => ["in", "pay-in"].includes(m.data?.type))
    .reduce((sum, m) => sum + Number(m.amount || 0), 0);
  const cashOut = movements
    .filter((m) =>
      ["out", "pay-out", "petty", "deposit"].includes(m.data?.type),
    )
    .reduce((sum, m) => sum + Number(m.amount || 0), 0);

  const expectedCash =
    Number(shift.openingFloat || 0) + cashCollected + cashIn - cashOut;
  const closingCash = Number(req.body.closingCash || 0);
  const variance =
    req.body.variance !== undefined
      ? Number(req.body.variance)
      : closingCash - expectedCash;

  shift.status = "closed";
  shift.closingCash = closingCash;
  shift.variance = variance;
  shift.closedBy = req.user._id;
  shift.payload = {
    ...shift.payload,
    expectedCash,
    cashCollected,
    cashIn,
    cashOut,
    closedAt: new Date(),
  };
  await shift.save();

  return res.json({ success: true, data: shift });
};

const startWorkflow = (type) => async (req, res) => {
  const run = await BillingWorkflow.create({
    hotelId: req.user.hotelId,
    type,
    status: "running",
    businessDate: req.body.businessDate || new Date(),
    payload: req.body,
    openedBy: req.user._id,
  });
  return res.status(201).json({ success: true, data: run });
};

export const startNightAudit = startWorkflow("night-audit");
export const runReconciliation = startWorkflow("reconciliation");
