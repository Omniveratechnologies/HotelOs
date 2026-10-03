import StockBatch from "../models/StockBatch.js";

// ------------------------------------------------------------
// Urgency bucket helper — used by Expiry Alerts
// ------------------------------------------------------------
const getUrgency = (expiryDate) => {
  if (!expiryDate) return "NO_EXPIRY";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiry = new Date(expiryDate);
  const expiryDay = new Date(
    expiry.getFullYear(),
    expiry.getMonth(),
    expiry.getDate(),
  );

  const diffDays = Math.round((expiryDay - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "EXPIRED";
  if (diffDays === 0) return "TODAY";
  if (diffDays <= 3) return "3_DAYS";
  if (diffDays <= 7) return "7_DAYS";
  return "SAFE";
};

// ------------------------------------------------------------
// EXPIRY ALERTS — batches expiring within `days`, plus anything
// already expired (always included regardless of `days`)
// ------------------------------------------------------------
const getExpiringBatches = async ({ days = 7 } = {}) => {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + Number(days));
  cutoff.setHours(23, 59, 59, 999);

  const batches = await StockBatch.find({
    expiryDate: { $exists: true, $ne: null, $lte: cutoff },
  })
    .populate("inventoryItem", "name category unit")
    .sort({ expiryDate: 1 });

  return batches.map((b) => ({
    _id: b._id,
    itemName: b.inventoryItem?.name || "Unknown item",
    category: b.category || b.inventoryItem?.category,
    batchNumber: b.batchNumber,
    supplierName: b.supplierName,
    quantity: b.quantityReceived, // Option A: not decremented on use — see note in service header
    unit: b.unit,
    expiryDate: b.expiryDate,
    receivedDate: b.receivedDate,
    urgency: getUrgency(b.expiryDate),
  }));
};

// ------------------------------------------------------------
// Summary counts for the Expiry Alerts stat row
// ------------------------------------------------------------
const getExpirySummary = async () => {
  const batches = await getExpiringBatches({ days: 7 });

  const counts = { EXPIRED: 0, TODAY: 0, "3_DAYS": 0, "7_DAYS": 0 };
  let estimatedValueAtRisk = 0;

  for (const b of batches) {
    if (counts[b.urgency] !== undefined) counts[b.urgency] += 1;
  }

  // value at risk = everything in the list (expired + expiring within 7 days)
  const allBatches = await StockBatch.find({
    expiryDate: {
      $exists: true,
      $ne: null,
      $lte: new Date(Date.now() + 7 * 86400000),
    },
  });
  estimatedValueAtRisk = allBatches.reduce(
    (sum, b) => sum + Number(b.quantityReceived) * Number(b.unitCost || 0),
    0,
  );

  return {
    expiredCount: counts.EXPIRED,
    expiringTodayCount: counts.TODAY,
    expiring3DaysCount: counts["3_DAYS"],
    expiring7DaysCount: counts["7_DAYS"],
    totalAtRisk: batches.length,
    estimatedValueAtRisk,
  };
};

// ------------------------------------------------------------
// BATCH MANAGEMENT — all batches, optionally grouped by item
// ------------------------------------------------------------
const getAllBatches = async ({
  search = "",
  groupByItem = false,
  page = 1,
  limit = 10,
} = {}) => {
  const query = {};

  if (search.trim()) {
    query.$or = [
      { batchNumber: { $regex: search.trim(), $options: "i" } },
      { supplierName: { $regex: search.trim(), $options: "i" } },
    ];
  }

  const pageNum = Math.max(Number(page) || 1, 1);
  const limitNum = Math.max(Number(limit) || 10, 1);
  const skip = (pageNum - 1) * limitNum;

  const batchesQuery = StockBatch.find(query)
    .populate("inventoryItem", "name category unit")
    .sort({ receivedDate: -1 });

  if (!groupByItem) {
    const [batches, totalRecords] = await Promise.all([
      batchesQuery.skip(skip).limit(limitNum),
      StockBatch.countDocuments(query),
    ]);

    return {
      grouped: false,
      batches: batches.map(formatBatch),
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalRecords,
        totalPages: Math.max(Math.ceil(totalRecords / limitNum), 1),
      },
    };
  }

  // Grouped view: fetch everything matching search (no pagination — item
  // count is usually small enough), grouped by item name
  const allBatches = await batchesQuery;
  const grouped = {};

  for (const b of allBatches) {
    const itemName = b.inventoryItem?.name || "Unknown item";
    if (!grouped[itemName]) grouped[itemName] = [];
    grouped[itemName].push(formatBatch(b));
  }

  return {
    grouped: true,
    items: Object.entries(grouped).map(([itemName, batches]) => ({
      itemName,
      batchCount: batches.length,
      totalQuantity: batches.reduce((sum, b) => sum + b.quantity, 0),
      batches,
    })),
  };
};

const formatBatch = (b) => ({
  _id: b._id,
  itemName: b.inventoryItem?.name || "Unknown item",
  category: b.category || b.inventoryItem?.category,
  batchNumber: b.batchNumber,
  supplierName: b.supplierName,
  quantity: b.quantityReceived,
  unit: b.unit,
  unitCost: b.unitCost,
  totalCost: b.totalCost,
  manufacturingDate: b.manufacturingDate,
  expiryDate: b.expiryDate,
  receivedDate: b.receivedDate,
  urgency: getUrgency(b.expiryDate),
});

export default {
  getExpiringBatches,
  getExpirySummary,
  getAllBatches,
};
