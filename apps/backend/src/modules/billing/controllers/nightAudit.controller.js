import BillingWorkflow from "../models/BillingWorkflow.js";
import BillingEntity from "../models/BillingEntity.js";
import Booking from "#/modules/bookings/models/Booking.js";
import Room from "#/modules/rooms/models/Room.js";
import Bill from "../models/Bill.js";
import Payment from "../models/Payment.js";

const steps = [
  "Verify all bookings and in-house folios",
  "Post room charges",
  "Post recurring charges",
  "Verify payments and settlements",
  "Generate no-show and cancellation charges",
  "Reconcile POS postings",
  "Run audit reports",
  "Roll over to next business date",
];
const dayRange = (date) => {
  const start = new Date(date || Date.now());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};
const total = (rows, field) =>
  rows.reduce((sum, row) => sum + Number(row[field] || 0), 0);

export const nightAuditOverview = async (req, res) => {
  const { start, end } = dayRange(req.query.date);
  const hotelId = req.user.hotelId;
  const [rooms, bookings, bills, payments, openShift, run] = await Promise.all([
    Room.find({ hotelId }).lean(),
    Booking.find({ hotelId }).sort({ checkIn: 1 }).limit(1000).lean(),
    Bill.find({ hotelId, createdAt: { $gte: start, $lt: end } }).lean(),
    Payment.find({ hotelId, createdAt: { $gte: start, $lt: end } }).lean(),
    BillingWorkflow.findOne({
      hotelId,
      type: "cashier-shift",
      status: "open",
    }).lean(),
    BillingWorkflow.findOne({
      hotelId,
      type: "night-audit",
      status: { $in: ["running", "open"] },
      businessDate: { $gte: start, $lt: end },
    })
      .sort({ createdAt: -1 })
      .lean(),
  ]);
  const inHouse = bookings.filter((row) => row.status === "checked-in");
  const arrivals = bookings.filter(
    (row) =>
      row.checkIn &&
      new Date(row.checkIn) >= start &&
      new Date(row.checkIn) < end,
  );
  const departures = bookings.filter(
    (row) =>
      row.checkOut &&
      new Date(row.checkOut) >= start &&
      new Date(row.checkOut) < end,
  );
  const roomRevenue = total(
    bills.filter((row) => row.billType === "room-charge"),
    "totalAmount",
  );
  const totalRevenue = total(bills, "totalAmount");
  const alerts = [
    departures.filter((row) => row.status === "checked-in").length
      ? `${departures.filter((row) => row.status === "checked-in").length} departures pending check-out`
      : null,
    openShift ? "Open cashier shift must be closed" : null,
    payments.some((row) => row.status === "pending")
      ? "Pending payment settlements require review"
      : null,
    rooms.filter((row) => row.status === "maintenance").length
      ? `${rooms.filter((row) => row.status === "maintenance").length} rooms in maintenance`
      : null,
    bills.filter((row) => row.status === "draft").length
      ? `${bills.filter((row) => row.status === "draft").length} unposted POS charges`
      : null,
  ].filter(Boolean);
  const stepRows = await BillingEntity.find({
    hotelId,
    entityType: "night-audit-step",
    "data.runId": run?._id,
  })
    .sort({ "data.stepNo": 1 })
    .lean();
  return res.json({
    success: true,
    data: {
      businessDate: start,
      run,
      metrics: {
        occupied: inHouse.length,
        totalRooms: rooms.length,
        arrivals: arrivals.length,
        departures: departures.length,
        roomRevenue,
        totalRevenue,
        occupancy: rooms.length
          ? Math.round((inHouse.length / rooms.length) * 100)
          : 0,
      },
      revenue: [
        { label: "Room Revenue", value: roomRevenue },
        {
          label: "F&B Revenue",
          value: total(
            bills.filter((row) => row.billType === "dine-in"),
            "totalAmount",
          ),
        },
        {
          label: "Other Charges",
          value: Math.max(0, totalRevenue - roomRevenue),
        },
        { label: "Miscellaneous", value: 0 },
        { label: "Total Revenue", value: totalRevenue },
      ],
      occupancy: [
        { label: "Occupied", value: inHouse.length },
        {
          label: "Vacant",
          value: rooms.filter((row) => row.status === "available").length,
        },
        {
          label: "Out of Order",
          value: rooms.filter((row) => row.status === "out-of-order").length,
        },
        {
          label: "Maintenance",
          value: rooms.filter((row) => row.status === "maintenance").length,
        },
      ],
      arrivals,
      departures,
      inHouse: inHouse.slice(0, 100),
      alerts,
      steps: steps.map((name, index) => ({
        stepNo: index + 1,
        name,
        status:
          stepRows.find((row) => row.data?.stepNo === index + 1)?.status ||
          "pending",
      })),
    },
  });
};

export const startNightAuditRun = async (req, res) => {
  const existing = await BillingWorkflow.findOne({
    hotelId: req.user.hotelId,
    type: "night-audit",
    status: { $in: ["running", "open"] },
  });
  if (existing)
    return res
      .status(409)
      .json({
        success: false,
        message: "A night audit is already running",
        data: existing,
      });
  const run = await BillingWorkflow.create({
    hotelId: req.user.hotelId,
    type: "night-audit",
    status: "running",
    businessDate: req.body.businessDate || new Date(),
    payload: { stepNames: steps },
    openedBy: req.user._id,
  });
  return res.status(201).json({ success: true, data: run });
};

export const executeNightAuditStep = async (req, res) => {
  const stepNo = Number(req.params.stepNo);
  if (!steps[stepNo - 1])
    return res
      .status(400)
      .json({ success: false, message: "Invalid night audit step" });
  const run = await BillingWorkflow.findOne({
    _id: req.params.runId,
    hotelId: req.user.hotelId,
    type: "night-audit",
    status: "running",
  });
  if (!run)
    return res
      .status(404)
      .json({ success: false, message: "Active night audit not found" });
  const row = await BillingEntity.findOneAndUpdate(
    {
      hotelId: req.user.hotelId,
      entityType: "night-audit-step",
      "data.runId": run._id,
      "data.stepNo": stepNo,
    },
    {
      $set: {
        status: "completed",
        amount: 0,
        data: {
          runId: run._id,
          stepNo,
          name: steps[stepNo - 1],
          result: { completedAt: new Date() },
          completedBy: req.user._id,
        },
      },
    },
    { upsert: true, new: true },
  );
  return res.json({ success: true, data: row });
};

export const confirmNightAuditStep = async (req, res) => {
  const row = await BillingEntity.findOneAndUpdate(
    {
      _id: req.params.stepId,
      hotelId: req.user.hotelId,
      entityType: "night-audit-step",
    },
    {
      $set: {
        status: "confirmed",
        "data.confirmedBy": req.user._id,
        "data.confirmedAt": new Date(),
      },
    },
    { new: true },
  ).lean();
  if (!row)
    return res
      .status(404)
      .json({ success: false, message: "Audit step not found" });
  return res.json({ success: true, data: row });
};

export const completeNightAudit = async (req, res) => {
  const run = await BillingWorkflow.findOne({
    _id: req.params.runId,
    hotelId: req.user.hotelId,
    type: "night-audit",
    status: "running",
  });
  if (!run)
    return res
      .status(404)
      .json({ success: false, message: "Active night audit not found" });
  const completed = await BillingEntity.countDocuments({
    hotelId: req.user.hotelId,
    entityType: "night-audit-step",
    "data.runId": run._id,
    status: { $in: ["completed", "confirmed"] },
  });
  if (completed < steps.length && !req.body.overrideReason)
    return res
      .status(400)
      .json({
        success: false,
        message: `Complete all ${steps.length} audit steps before rollover`,
      });
  run.status = "completed";
  run.closedBy = req.user._id;
  run.payload = {
    ...run.payload,
    completedSteps: completed,
    overrideReason: req.body.overrideReason || null,
    completedAt: new Date(),
  };
  await run.save();
  return res.json({ success: true, data: run });
};

export const nightAuditReport = async (req, res) => {
  const overview = await nightAuditOverview(
    { ...req, query: { ...req.query, date: req.query.date } },
    { json: (payload) => payload },
  );
  return res.json({
    success: true,
    data: { type: req.params.type, generatedAt: new Date(), report: overview },
  });
};
