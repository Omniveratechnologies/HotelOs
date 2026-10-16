import BillingWorkflow from "../models/BillingWorkflow.js";

export const openCashierShift = async (req, res) => {
  const existing = await BillingWorkflow.findOne({
    hotelId: req.user.hotelId,
    type: "cashier-shift",
    status: "open",
  });
  if (existing)
    return res
      .status(409)
      .json({
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
  const shift = await BillingWorkflow.findOneAndUpdate(
    {
      _id: req.params.id,
      hotelId: req.user.hotelId,
      type: "cashier-shift",
      status: "open",
    },
    {
      $set: {
        status: "closed",
        closingCash: Number(req.body.closingCash || 0),
        variance: Number(req.body.variance || 0),
        closedBy: req.user._id,
      },
    },
    { new: true },
  );
  if (!shift)
    return res
      .status(404)
      .json({ success: false, message: "Open cashier shift not found" });
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
