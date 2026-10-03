import PurchaseOrder from "../models/PurchaseOrder.js";
import Inventory from "../models/Inventory.js";
import Supplier from "../models/Supplier.js";

// ------------------------------------------------------------
// Status rules
// PARTIALLY_RECEIVED / RECEIVED are NOT listed: they are set
// automatically by the receive flow (inventoryServices).
// ------------------------------------------------------------
const STATUS_TRANSITIONS = {
  DRAFT: ["SENT", "CANCELLED"],
  SENT: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CANCELLED"],
  PARTIALLY_RECEIVED: [], // stock already came in -> cannot cancel
  RECEIVED: [],
  CANCELLED: [],
};

// UI uses this to show/hide buttons on the PO Detail page
const ACTIONS_BY_STATUS = {
  DRAFT: ["edit", "send", "cancel"],
  SENT: ["confirm", "cancel"],
  CONFIRMED: ["receive", "receiveAll", "cancel"],
  PARTIALLY_RECEIVED: ["receive", "receiveAll"],
  RECEIVED: [],
  CANCELLED: [],
};

const generatePONumber = async () => {
  const latestOrder = await PurchaseOrder.findOne({
    poNumber: { $exists: true, $ne: "" },
  })
    .sort({ createdAt: -1 })
    .select("poNumber");

  if (!latestOrder?.poNumber) return "PO-1001";

  const lastNumber = Number(latestOrder.poNumber.replace("PO-", ""));
  if (Number.isNaN(lastNumber)) return "PO-1001";

  return `PO-${lastNumber + 1}`;
};

// ------------------------------------------------------------
// Shared by create + update (removes the duplicated code)
// ------------------------------------------------------------
const buildOrderData = async ({ supplier, items, taxPercentage }) => {
  if (!supplier) throw new Error("Supplier is required");

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("At least one item is required");
  }

  const supplierData = await Supplier.findById(supplier);
  if (!supplierData) throw new Error("Supplier not found");

  const inventoryIds = items.map((item) => String(item.inventoryItem));

  if (new Set(inventoryIds).size !== inventoryIds.length) {
    throw new Error("Same item cannot be added twice in one purchase order");
  }

  const inventoryItems = await Inventory.find({ _id: { $in: inventoryIds } });

  if (inventoryItems.length !== items.length) {
    throw new Error("One or more inventory items not found");
  }

  const orderItems = items.map((item) => {
    const inventoryItem = inventoryItems.find(
      (inv) => inv._id.toString() === String(item.inventoryItem),
    );

    if (!inventoryItem) throw new Error("Inventory item not found");

    const quantity = Number(item.quantity);
    const unitCost = Number(item.unitCost);

    // !(x > 0) also catches NaN / undefined
    if (!(quantity > 0)) {
      throw new Error(
        `Quantity must be greater than 0 for ${inventoryItem.name}`,
      );
    }

    if (!(unitCost >= 0)) {
      throw new Error(`Unit cost cannot be negative for ${inventoryItem.name}`);
    }

    return {
      inventoryItem: inventoryItem._id,
      itemName: inventoryItem.name,
      category: inventoryItem.category,
      quantity,
      receivedQuantity: 0, // never trust client
      unit: inventoryItem.unit,
      unitCost,
      totalCost: quantity * unitCost,
    };
  });

  const subtotal = orderItems.reduce((t, i) => t + i.totalCost, 0);
  const tax = Number(taxPercentage) || 0;
  const taxAmount = (subtotal * tax) / 100;
  const totalAmount = subtotal + taxAmount;

  return { supplierData, orderItems, subtotal, tax, taxAmount, totalAmount };
};

// ------------------------------------------------------------
// CREATE
// ------------------------------------------------------------
const createPurchaseOrder = async ({
  supplier,
  expectedDeliveryDate,
  items,
  taxPercentage = 0,
  notes,
}) => {
  const { supplierData, orderItems, subtotal, tax, taxAmount, totalAmount } =
    await buildOrderData({ supplier, items, taxPercentage });

  const poNumber = await generatePONumber();

  return PurchaseOrder.create({
    poNumber,
    supplier: supplierData._id,
    supplierName: supplierData.supplierName,
    orderDate: new Date(),
    expectedDeliveryDate,
    items: orderItems,
    subtotal,
    taxPercentage: tax,
    taxAmount,
    totalAmount,
    status: "DRAFT", // always DRAFT, ignore client value
    statusHistory: [{ status: "DRAFT", at: new Date() }],
    receipts: [],
    notes,
  });
};

// ------------------------------------------------------------
// LIST
// ------------------------------------------------------------
const getPurchaseOrders = async ({ search = "", supplier, status }) => {
  const query = {};

  if (search.trim()) {
    query.$or = [
      { poNumber: { $regex: search.trim(), $options: "i" } },
      { supplierName: { $regex: search.trim(), $options: "i" } },
    ];
  }

  if (supplier && supplier !== "ALL") query.supplier = supplier;
  if (status && status !== "ALL") query.status = status;

  return PurchaseOrder.find(query)
    .populate("supplier", "supplierName supplierCode")
    .populate("items.inventoryItem", "name category unit")
    .sort({ createdAt: -1 });
};

// ------------------------------------------------------------
// DETAIL (screen 5)
// Note: items have no _id, and inventoryItem is populated, so the
// frontend should send item.inventoryItem._id as inventoryItemId
// when calling /receive.
// ------------------------------------------------------------
const getPurchaseOrderById = async (id) => {
  const po = await PurchaseOrder.findById(id)
    .populate("supplier", "supplierName supplierCode contactPerson phone email")
    .populate("items.inventoryItem", "name category unit")
    .lean();

  if (!po) throw new Error("Purchase order not found");

  const items = po.items.map((i) => {
    const received = Number(i.receivedQuantity || 0);
    const remaining = Math.max(Number(i.quantity) - received, 0);

    return {
      ...i,
      receivedQuantity: received,
      remainingQuantity: remaining,
      lineStatus:
        received === 0 ? "PENDING" : remaining > 0 ? "PARTIAL" : "RECEIVED",
    };
  });

  const totalOrdered = items.reduce((s, i) => s + Number(i.quantity), 0);
  const totalReceived = items.reduce((s, i) => s + i.receivedQuantity, 0);

  return {
    ...po,
    items,
    progress: {
      receivedLines: items.filter((i) => i.lineStatus === "RECEIVED").length,
      totalLines: items.length,
      percent: totalOrdered
        ? Math.round((totalReceived / totalOrdered) * 100)
        : 0,
    },
    allowedActions: ACTIONS_BY_STATUS[po.status] || [],
  };
};

// ------------------------------------------------------------
// STATUS CHANGE (Send / Confirm / Cancel)
// ------------------------------------------------------------
const updatePurchaseOrderStatus = async (id, status, userId) => {
  if (!status) throw new Error("Status is required");

  if (!Object.keys(STATUS_TRANSITIONS).includes(status)) {
    throw new Error("Invalid purchase order status");
  }

  const purchaseOrder = await PurchaseOrder.findById(id);
  if (!purchaseOrder) throw new Error("Purchase order not found");

  const allowed = STATUS_TRANSITIONS[purchaseOrder.status] || [];

  if (!allowed.includes(status)) {
    throw new Error(
      `Cannot change status from ${purchaseOrder.status} to ${status}`,
    );
  }

  purchaseOrder.status = status;
  purchaseOrder.statusHistory.push({
    status,
    changedBy: userId,
    at: new Date(),
  });

  await purchaseOrder.save();
  return purchaseOrder;
};

// ------------------------------------------------------------
// SUMMARY
// ------------------------------------------------------------
const getPurchaseOrderSummary = async () => {
  const [
    totalOrders,
    draftOrders,
    sentOrders,
    confirmedOrders,
    partiallyReceivedOrders,
    receivedOrders,
    cancelledOrders,
  ] = await Promise.all([
    PurchaseOrder.countDocuments(),
    PurchaseOrder.countDocuments({ status: "DRAFT" }),
    PurchaseOrder.countDocuments({ status: "SENT" }),
    PurchaseOrder.countDocuments({ status: "CONFIRMED" }),
    PurchaseOrder.countDocuments({ status: "PARTIALLY_RECEIVED" }),
    PurchaseOrder.countDocuments({ status: "RECEIVED" }),
    PurchaseOrder.countDocuments({ status: "CANCELLED" }),
  ]);

  return {
    totalOrders,
    draftOrders,
    sentOrders,
    confirmedOrders,
    partiallyReceivedOrders,
    receivedOrders,
    cancelledOrders,
  };
};

// ------------------------------------------------------------
// DELETE (DRAFT only)
// ------------------------------------------------------------
const deletePurchaseOrder = async (id) => {
  const purchaseOrder = await PurchaseOrder.findById(id);
  if (!purchaseOrder) throw new Error("Purchase order not found");

  if (purchaseOrder.status !== "DRAFT") {
    throw new Error("Only draft purchase orders can be deleted");
  }

  await purchaseOrder.deleteOne();
  return purchaseOrder;
};

// ------------------------------------------------------------
// UPDATE / EDIT (DRAFT only)
// ------------------------------------------------------------
const updatePurchaseOrder = async (
  id,
  { supplier, expectedDeliveryDate, items, taxPercentage = 0, notes },
) => {
  const purchaseOrder = await PurchaseOrder.findById(id);
  if (!purchaseOrder) throw new Error("Purchase order not found");

  if (purchaseOrder.status !== "DRAFT") {
    throw new Error("Only draft purchase orders can be edited");
  }

  const { supplierData, orderItems, subtotal, tax, taxAmount, totalAmount } =
    await buildOrderData({ supplier, items, taxPercentage });

  purchaseOrder.supplier = supplierData._id;
  purchaseOrder.supplierName = supplierData.supplierName;
  purchaseOrder.expectedDeliveryDate = expectedDeliveryDate;
  purchaseOrder.items = orderItems;
  purchaseOrder.subtotal = subtotal;
  purchaseOrder.taxPercentage = tax;
  purchaseOrder.taxAmount = taxAmount;
  purchaseOrder.totalAmount = totalAmount;
  purchaseOrder.notes = notes;

  await purchaseOrder.save();
  return purchaseOrder;
};

export default {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrderStatus,
  getPurchaseOrderSummary,
  deletePurchaseOrder,
  updatePurchaseOrder,
};
