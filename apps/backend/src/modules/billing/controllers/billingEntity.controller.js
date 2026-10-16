import BillingEntity from "../models/BillingEntity.js";

const allowedTypes = new Set([
  "invoice",
  "tax-rule",
  "company",
  "receivable",
  "payable",
  "expense",
  "recurring-expense",
  "deposit",
  "external-transaction",
  "discrepancy",
]);

export const listBillingEntities = async (req, res) => {
  const { type } = req.params;
  if (!allowedTypes.has(type))
    return res
      .status(400)
      .json({ success: false, message: "Unsupported billing entity" });
  const rows = await BillingEntity.find({
    hotelId: req.user.hotelId,
    entityType: type,
  })
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(req.query.limit || 250), 500))
    .lean();
  return res.json({ success: true, data: rows });
};

export const createBillingEntity = async (req, res) => {
  const { type } = req.params;
  if (!allowedTypes.has(type))
    return res
      .status(400)
      .json({ success: false, message: "Unsupported billing entity" });
  const {
    status = "draft",
    reference = "",
    amount = 0,
    businessDate,
    ...data
  } = req.body;
  const row = await BillingEntity.create({
    hotelId: req.user.hotelId,
    entityType: type,
    status,
    reference,
    amount: Number(amount || 0),
    businessDate: businessDate || new Date(),
    data,
    createdBy: req.user._id,
  });
  return res.status(201).json({ success: true, data: row });
};

export const updateBillingEntity = async (req, res) => {
  const row = await BillingEntity.findOneAndUpdate(
    {
      _id: req.params.id,
      hotelId: req.user.hotelId,
      entityType: req.params.type,
    },
    {
      $set: {
        status: req.body.status,
        amount: req.body.amount,
        data: req.body.data || req.body,
      },
    },
    { new: true },
  );
  if (!row)
    return res
      .status(404)
      .json({ success: false, message: "Billing record not found" });
  return res.json({ success: true, data: row });
};
