import mongoose from "mongoose";
import Inventory from "../models/Inventory.js";
import StockBatch from "../models/StockBatch.js";
import PurchaseHistory from "../models/PurchaseHistory.js";
import StockUsage from "../models/StockUsage.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import StockAdjustment from "../models/StockAdjustment.js";

const receiveStock = async (data) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      inventoryItemId,
      category,
      supplierName,
      batchNumber,
      manufacturingDate,
      expiryDate,
      quantityReceived,
      unit,
      unitCost,
      notes,
      receivedDate,
    } = data;

    // 1. Find inventory item
    const inventoryItem =
      await Inventory.findById(inventoryItemId).session(session);

    if (!inventoryItem) {
      throw new Error("Inventory item not found");
    }

    // 2. Validate quantity
    if (Number(quantityReceived) <= 0) {
      throw new Error("Quantity received must be greater than 0");
    }

    // 3. Calculate total cost
    const totalCost = Number(quantityReceived) * Number(unitCost);

    // 4. Create stock batch
    const stockBatch = new StockBatch({
      inventoryItem: inventoryItemId,
      category,
      supplierName,
      batchNumber,
      manufacturingDate,
      expiryDate,
      quantityReceived: Number(quantityReceived),
      unit,
      unitCost: Number(unitCost),
      totalCost,
      notes,
      receivedDate,
    });

    // Save stock batch inside transaction
    await stockBatch.save({ session });

    // 5. Increase current stock
    inventoryItem.currentStock += Number(quantityReceived);

    await inventoryItem.save({ session });

    // 6. Create purchase history
    await PurchaseHistory.create(
      [
        {
          inventoryItem: inventoryItemId,
          stockBatch: stockBatch._id,
          category,
          supplierName,
          quantity: Number(quantityReceived),
          unit,
          unitCost: Number(unitCost),
          totalCost,
          notes,
          purchaseDate: receivedDate,
        },
      ],
      { session },
    );

    // 7. Commit transaction
    await session.commitTransaction();

    return {
      inventoryItem,
      stockBatch,
      totalCost,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const receivePurchaseOrderStock = async (purchaseOrderId, data, userId) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const purchaseOrder =
      await PurchaseOrder.findById(purchaseOrderId).session(session);

    if (!purchaseOrder) throw new Error("Purchase order not found");

    if (!["CONFIRMED", "PARTIALLY_RECEIVED"].includes(purchaseOrder.status)) {
      throw new Error(
        `Cannot receive stock for purchase order with status ${purchaseOrder.status}`,
      );
    }

    if (!Array.isArray(data?.items) || data.items.length === 0) {
      throw new Error("At least one item is required");
    }

    const receiptLines = []; // <- for Receiving History

    for (const receivedItem of data.items) {
      const {
        inventoryItemId,
        quantityReceived,
        batchNumber,
        manufacturingDate,
        expiryDate,
        notes,
      } = receivedItem;

      const receivedDate = receivedItem.receivedDate || new Date(); // default

      if (!inventoryItemId) throw new Error("inventoryItemId is required");

      const poItem = purchaseOrder.items.find(
        (item) => item.inventoryItem.toString() === inventoryItemId.toString(),
      );
      if (!poItem) {
        throw new Error(
          "Inventory item does not belong to this purchase order",
        );
      }

      const quantity = Number(quantityReceived);
      // !(x > 0) also catches NaN / undefined
      if (!(quantity > 0)) {
        throw new Error(
          `Quantity received must be greater than 0 for ${poItem.itemName}`,
        );
      }

      const alreadyReceived = Number(poItem.receivedQuantity || 0);
      const remainingQuantity = Number(poItem.quantity) - alreadyReceived;

      if (quantity > remainingQuantity) {
        throw new Error(
          `Cannot receive more than remaining quantity for ${poItem.itemName}. Remaining: ${remainingQuantity}`,
        );
      }

      const inventoryItem =
        await Inventory.findById(inventoryItemId).session(session);
      if (!inventoryItem) {
        throw new Error(`Inventory item not found: ${poItem.itemName}`);
      }

      const totalCost = quantity * Number(poItem.unitCost);

      const stockBatch = new StockBatch({
        inventoryItem: inventoryItem._id,
        category: poItem.category,
        supplierName: purchaseOrder.supplierName,
        batchNumber,
        manufacturingDate,
        expiryDate,
        quantityReceived: quantity,
        unit: poItem.unit,
        unitCost: Number(poItem.unitCost),
        totalCost,
        notes,
        receivedDate,
      });
      await stockBatch.save({ session });

      inventoryItem.currentStock += quantity;
      await inventoryItem.save({ session });

      await PurchaseHistory.create(
        [
          {
            inventoryItem: inventoryItem._id,
            stockBatch: stockBatch._id,
            category: poItem.category,
            supplierName: purchaseOrder.supplierName,
            quantity,
            unit: poItem.unit,
            unitCost: Number(poItem.unitCost),
            totalCost,
            notes,
            purchaseDate: receivedDate,
          },
        ],
        { session },
      );

      poItem.receivedQuantity = alreadyReceived + quantity;

      receiptLines.push({
        inventoryItem: inventoryItem._id,
        itemName: poItem.itemName,
        quantity,
        batchNumber,
        stockBatch: stockBatch._id,
      });
    }

    // NEW: save this delivery in history
    purchaseOrder.receipts.push({
      receivedAt: new Date(),
      receivedBy: userId,
      lines: receiptLines,
    });

    const allItemsReceived = purchaseOrder.items.every(
      (i) => Number(i.receivedQuantity || 0) >= Number(i.quantity),
    );
    const someItemsReceived = purchaseOrder.items.some(
      (i) => Number(i.receivedQuantity || 0) > 0,
    );

    const newStatus = allItemsReceived
      ? "RECEIVED"
      : someItemsReceived
        ? "PARTIALLY_RECEIVED"
        : purchaseOrder.status;

    if (newStatus !== purchaseOrder.status) {
      purchaseOrder.status = newStatus;
      purchaseOrder.statusHistory.push({
        status: newStatus,
        changedBy: userId,
        note: "Auto-updated by receiving stock",
        at: new Date(),
      });
    }

    await purchaseOrder.save({ session });
    await session.commitTransaction();

    return { purchaseOrder };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const receiveAllPurchaseOrderStock = async (
  purchaseOrderId,
  data = {},
  userId,
) => {
  const po = await PurchaseOrder.findById(purchaseOrderId);
  if (!po) throw new Error("Purchase order not found");

  const items = po.items
    .filter((i) => Number(i.quantity) - Number(i.receivedQuantity || 0) > 0)
    .map((i, idx) => {
      const d = data.itemDetails?.[String(i.inventoryItem)] || {};
      return {
        inventoryItemId: i.inventoryItem,
        quantityReceived: Number(i.quantity) - Number(i.receivedQuantity || 0),
        batchNumber: d.batchNumber || `${po.poNumber}-${Date.now()}-${idx + 1}`,
        manufacturingDate: d.manufacturingDate,
        expiryDate: d.expiryDate,
        notes: data.notes || "Received via Mark as Received",
        receivedDate: data.receivedDate,
      };
    });

  if (items.length === 0) throw new Error("Nothing left to receive");

  return receivePurchaseOrderStock(purchaseOrderId, { items }, userId);
};

const useStock = async (data) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      inventoryItemId,
      category,
      quantityUsed,
      unit,
      usageType,
      department,
      reference,
      notes,
      usedDate,
    } = data;

    const inventoryItem =
      await Inventory.findById(inventoryItemId).session(session);

    if (!inventoryItem) {
      throw new Error("Inventory item not found");
    }

    if (Number(quantityUsed) <= 0) {
      throw new Error("Quantity used must be greater than 0");
    }

    if (Number(quantityUsed) > inventoryItem.currentStock) {
      throw new Error("Insufficient stock");
    }

    inventoryItem.currentStock -= Number(quantityUsed);

    await inventoryItem.save({ session });

    const stockUsage = new StockUsage({
      inventoryItem: inventoryItemId,
      category,
      quantityUsed: Number(quantityUsed),
      unit,
      usageType,
      department,
      reference,
      notes,
      usedDate,
    });

    await stockUsage.save({ session });

    await session.commitTransaction();

    return {
      inventoryItem,
      stockUsage,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};
const getUsageHistory = async () => {
  return await StockUsage.find()
    .populate("inventoryItem", "name category unit")
    .sort({ usedDate: -1 })
    .limit(20);
};

const getPurchaseHistory = async () => {
  const purchaseHistory = await PurchaseHistory.find()
    .populate("inventoryItem", "name category unit")
    .populate("stockBatch")
    .sort({ purchaseDate: -1 })
    .limit(20);

  return purchaseHistory;
};

const getLowStockItems = async () => {
  const items = await Inventory.find({
    $expr: {
      $lte: ["$currentStock", "$minimumStock"],
    },
  }).sort({ currentStock: 1 });

  return items.map((item) => {
    const currentStock = Number(item.currentStock);
    const minimumStock = Number(item.minimumStock);
    const costPerUnit = Number(item.costPerUnit);

    let status = "LOW";

    if (currentStock === 0) {
      status = "OUT OF STOCK";
    } else if (currentStock < minimumStock * 0.25) {
      status = "CRITICAL";
    }

    const reorderQuantity = Math.max(minimumStock - currentStock, 0);

    const estimatedPurchaseValue = reorderQuantity * costPerUnit;

    return {
      _id: item._id,
      name: item.name,
      category: item.category,
      currentStock,
      minimumStock,
      unit: item.unit,
      costPerUnit,
      reorderQuantity,
      estimatedPurchaseValue,
      status,
    };
  });
};

const adjustStock = async (data) => {
  const { inventoryItemId, physicalStock, reason, adjustmentDate, notes } =
    data;

  if (!inventoryItemId) {
    throw new Error("Inventory item is required");
  }

  if (
    physicalStock === undefined ||
    physicalStock === null ||
    physicalStock === "" ||
    !Number.isFinite(Number(physicalStock)) ||
    Number(physicalStock) < 0
  ) {
    throw new Error("Physical stock must be a valid non-negative number");
  }

  if (!reason?.trim()) {
    throw new Error("Adjustment reason is required");
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const inventoryItem =
      await Inventory.findById(inventoryItemId).session(session);

    if (!inventoryItem) {
      throw new Error("Inventory item not found");
    }

    const previousStock = Number(inventoryItem.currentStock);
    const newPhysicalStock = Number(physicalStock);
    const difference = newPhysicalStock - previousStock;

    inventoryItem.currentStock = newPhysicalStock;
    await inventoryItem.save({ session });

    const [adjustment] = await StockAdjustment.create(
      [
        {
          inventoryItem: inventoryItem._id,
          previousStock,
          physicalStock: newPhysicalStock,
          difference,
          reason: reason.trim(),
          adjustmentDate: adjustmentDate || new Date(),
          notes: notes?.trim() || "",
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return {
      inventoryItem,
      adjustment,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export default {
  receiveStock,
  useStock,
  getUsageHistory,
  getPurchaseHistory,
  getLowStockItems,
  receivePurchaseOrderStock,
  receiveAllPurchaseOrderStock,
  adjustStock,
};
