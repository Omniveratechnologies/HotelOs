import BillingSettings from "../models/BillingSettings.js";
import BillingEntity from "../models/BillingEntity.js";
import TaxRule from "../models/TaxRule.js";

const normalize = (rule) => ({
  id: rule._id,
  name: rule.name,
  code: rule.code,
  type: rule.type,
  rate: rule.rate,
  fixedAmount: rule.fixedAmount,
  calcMethod: rule.calcMethod,
  applicableOn: rule.applicableOn,
  taxGroup: rule.taxGroup,
  hsnSac: rule.hsnSac,
  description: rule.description,
  slabMin: rule.slabMin,
  slabMax: rule.slabMax,
  compound: rule.compound,
  active: rule.active,
  status: rule.active ? "active" : "inactive",
  effectiveFrom: rule.effectiveFrom,
  effectiveTo: rule.effectiveTo,
  version: rule.version,
});

const validateRule = (body) => {
  if (!body.name || !body.type || !body.applicableOn)
    return "Name, type and applicable department are required";
  if (
    ["tax", "service_charge"].includes(body.type) &&
    (Number(body.rate) < 0 || Number(body.rate) > 100)
  )
    return "Rate must be between 0 and 100";
  if (body.type === "fixed_charge" && Number(body.fixedAmount || body.rate) < 0)
    return "Fixed amount cannot be negative";
  if (
    body.slabMin &&
    body.slabMax &&
    Number(body.slabMin) > Number(body.slabMax)
  )
    return "Slab minimum cannot exceed maximum";
  return null;
};

export const listTaxRules = async (req, res) => {
  const filter = { hotelId: req.user.hotelId };
  if (req.query.applicable_on) filter.applicableOn = req.query.applicable_on;
  const rules = await TaxRule.find(filter)
    .sort({ applicableOn: 1, name: 1, version: -1 })
    .lean();
  return res.json({ success: true, data: rules.map(normalize) });
};

export const createTaxRule = async (req, res) => {
  const error = validateRule(req.body);
  if (error) return res.status(400).json({ success: false, message: error });
  const previous = await TaxRule.findOne({
    hotelId: req.user.hotelId,
    name: req.body.name,
    applicableOn: req.body.applicableOn,
  })
    .sort({ version: -1 })
    .lean();
  const rule = await TaxRule.create({
    ...req.body,
    hotelId: req.user.hotelId,
    rate: Number(req.body.rate || 0),
    fixedAmount: Number(req.body.fixedAmount || 0),
    version: (previous?.version || 0) + 1,
    createdBy: req.user._id,
  });
  await BillingEntity.create({
    hotelId: req.user.hotelId,
    entityType: "audit-log",
    status: "completed",
    reference: `tax-rule:create:${rule._id}`,
    data: { action: "create", after: rule.toObject() },
    createdBy: req.user._id,
  });
  return res.status(201).json({ success: true, data: normalize(rule) });
};

export const updateTaxRule = async (req, res) => {
  const current = await TaxRule.findOne({
    _id: req.params.id,
    hotelId: req.user.hotelId,
  });
  if (!current)
    return res
      .status(404)
      .json({ success: false, message: "Tax rule not found" });
  const error = validateRule({ ...current.toObject(), ...req.body });
  if (error) return res.status(400).json({ success: false, message: error });
  current.effectiveTo = new Date();
  await current.save();
  const next = await TaxRule.create({
    ...current.toObject(),
    ...req.body,
    _id: undefined,
    effectiveTo: null,
    effectiveFrom: req.body.effectiveFrom || new Date(),
    version: current.version + 1,
    createdBy: req.user._id,
  });
  await BillingEntity.create({
    hotelId: req.user.hotelId,
    entityType: "audit-log",
    status: "completed",
    reference: `tax-rule:update:${next._id}`,
    data: {
      action: "update",
      before: current.toObject(),
      after: next.toObject(),
    },
    createdBy: req.user._id,
  });
  return res.json({ success: true, data: normalize(next) });
};

export const toggleTaxRule = async (req, res) => {
  const rule = await TaxRule.findOneAndUpdate(
    { _id: req.params.id, hotelId: req.user.hotelId },
    { $set: { active: Boolean(req.body.active) } },
    { new: true },
  );
  if (!rule)
    return res
      .status(404)
      .json({ success: false, message: "Tax rule not found" });
  return res.json({ success: true, data: normalize(rule) });
};

export const simulateTax = async (req, res) => {
  const amount = Number(req.body.amount || 0);
  const rate = Number(req.body.rate || 0);
  const fixedAmount = Number(req.body.fixedAmount || 0);
  const service =
    req.body.type === "service_charge" ? Math.round(amount * rate) / 100 : 0;
  const taxBase = req.body.compound ? amount + service : amount;
  const tax =
    req.body.type === "fixed_charge"
      ? fixedAmount
      : Math.round(taxBase * rate) / 100;
  return res.json({
    success: true,
    data: {
      base: amount,
      serviceCharge: service,
      tax,
      total: amount + service + tax,
      rounding: "nearest paise",
    },
  });
};

export const getTaxSettings = async (req, res) => {
  let settings = await BillingSettings.findOne({
    hotelId: req.user.hotelId,
  }).lean();
  if (!settings) settings = { taxSettings: {}, rounding: {} };
  return res.json({
    success: true,
    data: { ...settings.taxSettings, rounding: settings.rounding },
  });
};

export const updateTaxSettings = async (req, res) => {
  const settings = await BillingSettings.findOneAndUpdate(
    { hotelId: req.user.hotelId },
    {
      $set: {
        taxSettings: req.body.taxSettings || req.body,
        rounding: req.body.rounding || {},
      },
    },
    { new: true, upsert: true },
  );
  return res.json({
    success: true,
    data: { ...settings.taxSettings, rounding: settings.rounding },
  });
};
