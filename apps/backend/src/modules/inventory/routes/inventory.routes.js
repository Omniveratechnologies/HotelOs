import express from "express";

import {
  getInventoryItems,
  receiveStock,
  useStock,
  getUsageHistory,
  getPurchaseHistory,
  getLowStockItems,
  getSuppliers,
  getSupplierSummary,
  getSupplierById,
  createSupplier,
  updateSupplier,
  updateSupplierStatus,
  deleteSupplier,
  getPurchaseOrderSummary,
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  deletePurchaseOrder,
  updatePurchaseOrder,
  receivePurchaseOrderStock,
  receiveAllPurchaseOrderStock,
  adjustStock,
  createWastage,
  updateWastage,
  deleteWastage,
  getWastageRecords,
  getWastageById,
  getWastageSummary,
  getWastageReasonsBreakdown,
  getTopWastedItems,
  getMonthlyWastageTrend,
  getExpiringBatches,
  getExpirySummary,
  getAllBatches,
  getRecipesController,
  getRecipeByIdController,
  createRecipeController,
  updateRecipeController,
  deleteRecipeController,
  duplicateRecipeController,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
  createInventoryItem,
  getRecipeOrders,
  getRecipeUsage,
} from "../controllers/inventory.controller.js";

const inventoryRoutes = express.Router();

// ------------------------------------------------------------
// General inventory
// ------------------------------------------------------------
inventoryRoutes.get("/items", getInventoryItems);
inventoryRoutes.post("/receive", receiveStock);
inventoryRoutes.post("/use", useStock);
inventoryRoutes.get("/usage", getUsageHistory);
inventoryRoutes.get("/purchase-history", getPurchaseHistory);
inventoryRoutes.get("/low-stock", getLowStockItems);
inventoryRoutes.post("/adjustments", adjustStock);

// ------------------------------------------------------------
// Suppliers — fixed paths before /:id
// ------------------------------------------------------------
inventoryRoutes.get("/suppliers", getSuppliers);
inventoryRoutes.get("/suppliers/summary", getSupplierSummary);
inventoryRoutes.get("/suppliers/:id", getSupplierById);
inventoryRoutes.post("/suppliers", createSupplier);
inventoryRoutes.patch("/suppliers/:id", updateSupplier);
inventoryRoutes.patch("/suppliers/:id/status", updateSupplierStatus);
inventoryRoutes.delete("/suppliers/:id", deleteSupplier);

// ------------------------------------------------------------
// Purchase Orders — fixed paths before /:id
// ------------------------------------------------------------
inventoryRoutes.get("/purchase-orders/summary", getPurchaseOrderSummary);
inventoryRoutes.get("/purchase-orders", getPurchaseOrders);
inventoryRoutes.get("/purchase-orders/:id", getPurchaseOrderById);
inventoryRoutes.post("/purchase-orders", createPurchaseOrder);
inventoryRoutes.patch("/purchase-orders/:id/status", updatePurchaseOrderStatus);
inventoryRoutes.delete("/purchase-orders/:id", deletePurchaseOrder);
inventoryRoutes.patch("/purchase-orders/:id", updatePurchaseOrder);
inventoryRoutes.post("/purchase-orders/:id/receive", receivePurchaseOrderStock);
inventoryRoutes.post(
  "/purchase-orders/:id/receive-all",
  receiveAllPurchaseOrderStock,
);

// ------------------------------------------------------------
// Batches — fixed paths before /batches/:id (none right now, but keep the habit)
// ------------------------------------------------------------
inventoryRoutes.get("/batches/expiring", getExpiringBatches);
inventoryRoutes.get("/batches/expiry-summary", getExpirySummary);
inventoryRoutes.get("/batches", getAllBatches);

// ------------------------------------------------------------
// Wastage — ALL prefixed with /wastage, fixed paths before /wastage/:id
// ------------------------------------------------------------
inventoryRoutes.get("/wastage/summary", getWastageSummary);
inventoryRoutes.get("/wastage/reasons", getWastageReasonsBreakdown);
inventoryRoutes.get("/wastage/top-items", getTopWastedItems);
inventoryRoutes.get("/wastage/trend", getMonthlyWastageTrend);

inventoryRoutes.get("/wastage", getWastageRecords);
inventoryRoutes.post("/wastage", createWastage);

inventoryRoutes.get("/wastage/:id", getWastageById);
inventoryRoutes.put("/wastage/:id", updateWastage);
inventoryRoutes.delete("/wastage/:id", deleteWastage);

// ------------------------------------------------------------
// Recipes
// ------------------------------------------------------------

inventoryRoutes.get("/recipes", getRecipesController);

inventoryRoutes.get("/recipes/:id", getRecipeByIdController);

inventoryRoutes.post("/recipes", createRecipeController);

inventoryRoutes.patch("/recipes/:id", updateRecipeController);

inventoryRoutes.delete("/recipes/:id", deleteRecipeController);

inventoryRoutes.post("/recipes/:id/duplicate", duplicateRecipeController);
inventoryRoutes.post("/items", createInventoryItem);
inventoryRoutes.get("/items/:id", getInventoryItemById);
inventoryRoutes.patch("/items/:id", updateInventoryItem);
inventoryRoutes.delete("/items/:id", deleteInventoryItem);

inventoryRoutes.get("/recipes/:id/orders", getRecipeOrders);
inventoryRoutes.get("/recipes/:id/usage-history", getRecipeUsage);

export default inventoryRoutes;
