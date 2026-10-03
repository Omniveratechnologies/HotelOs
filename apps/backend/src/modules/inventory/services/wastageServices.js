import mongoose from "mongoose";
import Wastage from "../models/Wastage.js";
import Inventory from "../models/Inventory.js";

const REASON_LABELS = {
  EXPIRED: "Expired",
  SPOILED: "Spoiled",
  DAMAGED: "Damaged",
  OVERPRODUCTION: "Overproduction",
  BURNT: "Burnt",
  DROPPED: "Dropped",
  UNKNOWN: "Unknown",
};

// ------------------------------------------------------------
// Date range helper: "This Month" / "This Week" / "Today" / "All Time"
// ------------------------------------------------------------
const getDateRange = (period = "This Month") => {
  const now = new Date();
  let start;

  if (period === "Today") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === "This Week") {
    const day = now.getDay(); // 0 = Sunday
    start = new Date(now);
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
  } else if (period === "This Month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    return null; // All Time
  }

  return { $gte: start };
};

// ------------------------------------------------------------
// CREATE — also decrements inventory stock (wastage removes stock)
// ------------------------------------------------------------
const createWastage = async (data) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      inventoryItemId,
      batchNumber,
      quantity,
      unit,
      reason,
      department,
      date,
      notes,
    } = data;

    if (!inventoryItemId) throw new Error("Item is required");
    if (!(Number(quantity) > 0))
      throw new Error("Quantity must be greater than 0");
    if (!reason) throw new Error("Reason is required");
    if (!department) throw new Error("Department is required");

    const inventoryItem =
      await Inventory.findById(inventoryItemId).session(session);
    if (!inventoryItem) throw new Error("Inventory item not found");

    const qty = Number(quantity);

    if (qty > inventoryItem.currentStock) {
      throw new Error(
        `Cannot record more wastage than current stock. Available: ${inventoryItem.currentStock} ${inventoryItem.unit}`,
      );
    }

    const costPerUnit = Number(inventoryItem.costPerUnit || 0);
    const totalCost = qty * costPerUnit;

    const wastage = await Wastage.create(
      [
        {
          inventoryItem: inventoryItem._id,
          itemName: inventoryItem.name,
          batchNumber,
          quantity: qty,
          unit: unit || inventoryItem.unit,
          reason,
          department,
          date: date || new Date(),
          notes,
          costPerUnit,
          totalCost,
        },
      ],
      { session },
    );

    inventoryItem.currentStock -= qty;
    await inventoryItem.save({ session });

    await session.commitTransaction();
    return wastage[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

// ------------------------------------------------------------
// UPDATE — adjusts inventory by the difference in quantity only
// ------------------------------------------------------------
const updateWastage = async (id, data) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const wastage = await Wastage.findById(id).session(session);
    if (!wastage) throw new Error("Wastage record not found");

    const inventoryItem = await Inventory.findById(
      wastage.inventoryItem,
    ).session(session);
    if (!inventoryItem) throw new Error("Inventory item not found");

    const newQty = Number(data.quantity ?? wastage.quantity);
    if (!(newQty > 0)) throw new Error("Quantity must be greater than 0");

    const diff = newQty - wastage.quantity; // +ve = more wastage now
    if (diff > inventoryItem.currentStock) {
      throw new Error(
        `Not enough stock to increase wastage by that much. Available: ${inventoryItem.currentStock} ${inventoryItem.unit}`,
      );
    }

    inventoryItem.currentStock -= diff;
    await inventoryItem.save({ session });

    wastage.quantity = newQty;
    wastage.batchNumber = data.batchNumber ?? wastage.batchNumber;
    wastage.unit = data.unit ?? wastage.unit;
    wastage.reason = data.reason ?? wastage.reason;
    wastage.department = data.department ?? wastage.department;
    wastage.date = data.date ?? wastage.date;
    wastage.notes = data.notes ?? wastage.notes;
    wastage.totalCost = newQty * wastage.costPerUnit;

    await wastage.save({ session });
    await session.commitTransaction();
    return wastage;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

// ------------------------------------------------------------
// DELETE — restores the wasted quantity back to stock
// ------------------------------------------------------------
const deleteWastage = async (id) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const wastage = await Wastage.findById(id).session(session);
    if (!wastage) throw new Error("Wastage record not found");

    const inventoryItem = await Inventory.findById(
      wastage.inventoryItem,
    ).session(session);
    if (inventoryItem) {
      inventoryItem.currentStock += wastage.quantity;
      await inventoryItem.save({ session });
    }

    await wastage.deleteOne({ session });
    await session.commitTransaction();
    return wastage;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

// ------------------------------------------------------------
// LIST (paginated, searchable, filterable) — feeds Wastage History table
// ------------------------------------------------------------
const getWastageRecords = async ({
  search = "",
  reason = "ALL",
  department = "ALL",
  period = "All Time",
  page = 1,
  limit = 5,
}) => {
  const query = {};

  if (search.trim()) {
    query.$or = [
      { itemName: { $regex: search.trim(), $options: "i" } },
      { batchNumber: { $regex: search.trim(), $options: "i" } },
    ];
  }

  if (reason && reason !== "ALL") query.reason = reason;
  if (department && department !== "ALL") query.department = department;

  const dateRange = getDateRange(period);
  if (dateRange) query.date = dateRange;

  const pageNum = Math.max(Number(page) || 1, 1);
  const limitNum = Math.max(Number(limit) || 5, 1);
  const skip = (pageNum - 1) * limitNum;

  const [records, totalRecords] = await Promise.all([
    Wastage.find(query).sort({ date: -1 }).skip(skip).limit(limitNum),
    Wastage.countDocuments(query),
  ]);

  return {
    records,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalRecords,
      totalPages: Math.max(Math.ceil(totalRecords / limitNum), 1),
    },
  };
};

const getWastageById = async (id) => {
  const wastage = await Wastage.findById(id);
  if (!wastage) throw new Error("Wastage record not found");
  return wastage;
};

// ------------------------------------------------------------
// SUMMARY — the 4 top stat cards
// ------------------------------------------------------------
const getWastageSummary = async ({ period = "This Month" } = {}) => {
  const dateRange = getDateRange(period);
  const match = dateRange ? { date: dateRange } : {};

  const [current, reasonAgg] = await Promise.all([
    Wastage.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: "$quantity" },
          totalCost: { $sum: "$totalCost" },
          totalRecords: { $sum: 1 },
        },
      },
    ]),
    Wastage.aggregate([
      { $match: match },
      { $group: { _id: "$reason", quantity: { $sum: "$quantity" } } },
      { $sort: { quantity: -1 } },
      { $limit: 1 },
    ]),
  ]);

  // % change vs previous month (only meaningful when period === "This Month")
  let percentChangeQty = null;
  let percentChangeCost = null;

  if (period === "This Month") {
    const now = new Date();
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 1);

    const [prev] = await Wastage.aggregate([
      { $match: { date: { $gte: prevStart, $lt: prevEnd } } },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: "$quantity" },
          totalCost: { $sum: "$totalCost" },
        },
      },
    ]);

    const currQty = current[0]?.totalQuantity || 0;
    const currCost = current[0]?.totalCost || 0;
    const prevQty = prev?.totalQuantity || 0;
    const prevCost = prev?.totalCost || 0;

    percentChangeQty =
      prevQty > 0 ? Math.round(((currQty - prevQty) / prevQty) * 100) : null;
    percentChangeCost =
      prevCost > 0
        ? Math.round(((currCost - prevCost) / prevCost) * 100)
        : null;
  }

  const topReasonAgg = reasonAgg[0];
  const totalQty = current[0]?.totalQuantity || 0;

  return {
    totalWastageQuantity: totalQty,
    totalWastageCost: current[0]?.totalCost || 0,
    totalRecords: current[0]?.totalRecords || 0,
    topReason: topReasonAgg
      ? {
          reason: topReasonAgg._id,
          label: REASON_LABELS[topReasonAgg._id] || topReasonAgg._id,
          percentOfTotal: totalQty
            ? Math.round((topReasonAgg.quantity / totalQty) * 100)
            : 0,
        }
      : null,
    percentChangeQty,
    percentChangeCost,
  };
};

// ------------------------------------------------------------
// Donut chart — wastage by reason
// ------------------------------------------------------------
const getWastageReasonsBreakdown = async ({ period = "This Month" } = {}) => {
  const dateRange = getDateRange(period);
  const match = dateRange ? { date: dateRange } : {};

  const results = await Wastage.aggregate([
    { $match: match },
    { $group: { _id: "$reason", quantity: { $sum: "$quantity" } } },
    { $sort: { quantity: -1 } },
  ]);

  const total = results.reduce((sum, r) => sum + r.quantity, 0);

  return {
    total,
    breakdown: results.map((r) => ({
      reason: r._id,
      label: REASON_LABELS[r._id] || r._id,
      quantity: r.quantity,
      percent: total ? Math.round((r.quantity / total) * 100) : 0,
    })),
  };
};

// ------------------------------------------------------------
// Top Wasted Items (sidebar card)
// ------------------------------------------------------------
const getTopWastedItems = async ({ period = "This Month", limit = 5 } = {}) => {
  const dateRange = getDateRange(period);
  const match = dateRange ? { date: dateRange } : {};

  const results = await Wastage.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$itemName",
        totalQuantity: { $sum: "$quantity" },
        unit: { $first: "$unit" },
      },
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: Number(limit) },
  ]);

  return results.map((r) => ({
    itemName: r._id,
    quantity: r.totalQuantity,
    unit: r.unit,
  }));
};

// ------------------------------------------------------------
// Monthly Wastage Trend (sidebar card, last N months)
// ------------------------------------------------------------
const getMonthlyWastageTrend = async ({ months = 6 } = {}) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const results = await Wastage.aggregate([
    { $match: { date: { $gte: start } } },
    {
      $group: {
        _id: { year: { $year: "$date" }, month: { $month: "$date" } },
        totalQuantity: { $sum: "$quantity" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const trend = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const match = results.find(
      (r) => r._id.year === d.getFullYear() && r._id.month === d.getMonth() + 1,
    );
    trend.push({
      month: monthNames[d.getMonth()],
      quantity: match?.totalQuantity || 0,
    });
  }

  return trend;
};

export default {
  createWastage,
  updateWastage,
  deleteWastage,
  getWastageRecords,
  getWastageById,
  getWastageSummary,
  getWastageReasonsBreakdown,
  getTopWastedItems,
  getMonthlyWastageTrend,
};
