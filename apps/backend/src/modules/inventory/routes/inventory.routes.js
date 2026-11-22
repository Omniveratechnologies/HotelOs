import express from "express";
import { validate } from "#/shared/middleware/validate.middleware.js";
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
import {
  receiveStockBodySchema,
  useStockBodySchema,
  getUsageHistoryQuerySchema,
  getPurchaseHistoryQuerySchema,
  adjustStockBodySchema,
  createSupplierBodySchema,
  updateSupplierBodySchema,
  updateSupplierStatusBodySchema,
  getSuppliersQuerySchema,
  createPurchaseOrderBodySchema,
  updatePurchaseOrderBodySchema,
  updatePurchaseOrderStatusBodySchema,
  receivePurchaseOrderStockBodySchema,
  getPurchaseOrdersQuerySchema,
  createWastageBodySchema,
  updateWastageBodySchema,
  getWastageRecordsQuerySchema,
  getWastageSummaryQuerySchema,
  getTopWastedItemsQuerySchema,
  getMonthlyWastageTrendQuerySchema,
  getExpiringBatchesQuerySchema,
  getAllBatchesQuerySchema,
  createRecipeBodySchema,
  updateRecipeBodySchema,
  duplicateRecipeBodySchema,
  getRecipeOrdersQuerySchema,
  getRecipeUsageQuerySchema,
  createInventoryItemBodySchema,
  updateInventoryItemBodySchema,
  supplierIdParamsSchema,
  purchaseOrderIdParamsSchema,
  wastageIdParamsSchema,
  recipeIdParamsSchema,
  inventoryItemIdParamsSchema,
} from "../schemas.js";

const inventoryRoutes = express.Router();

// ------------------------------------------------------------
// General inventory
// ------------------------------------------------------------
inventoryRoutes.get("/items", getInventoryItems);
inventoryRoutes.post(
  "/receive",
  validate({ body: receiveStockBodySchema }),
  receiveStock,
);
inventoryRoutes.post("/use", validate({ body: useStockBodySchema }), useStock);
inventoryRoutes.get(
  "/usage",
  validate({ query: getUsageHistoryQuerySchema }),
  getUsageHistory,
);
inventoryRoutes.get(
  "/purchase-history",
  validate({ query: getPurchaseHistoryQuerySchema }),
  getPurchaseHistory,
);
inventoryRoutes.get("/low-stock", getLowStockItems);
inventoryRoutes.post(
  "/adjustments",
  validate({ body: adjustStockBodySchema }),
  adjustStock,
);

// ------------------------------------------------------------
// Suppliers — fixed paths before /:id
// ------------------------------------------------------------
inventoryRoutes.get(
  "/suppliers",
  validate({ query: getSuppliersQuerySchema }),
  getSuppliers,
);
inventoryRoutes.get("/suppliers/summary", getSupplierSummary);
inventoryRoutes.get(
  "/suppliers/:id",
  validate({ params: supplierIdParamsSchema }),
  getSupplierById,
);
inventoryRoutes.post(
  "/suppliers",
  validate({ body: createSupplierBodySchema }),
  createSupplier,
);
inventoryRoutes.patch(
  "/suppliers/:id",
  validate({ params: supplierIdParamsSchema, body: updateSupplierBodySchema }),
  updateSupplier,
);
inventoryRoutes.patch(
  "/suppliers/:id/status",
  validate({
    params: supplierIdParamsSchema,
    body: updateSupplierStatusBodySchema,
  }),
  updateSupplierStatus,
);
inventoryRoutes.delete(
  "/suppliers/:id",
  validate({ params: supplierIdParamsSchema }),
  deleteSupplier,
);

// ------------------------------------------------------------
// Purchase Orders — fixed paths before /:id
// ------------------------------------------------------------
inventoryRoutes.get("/purchase-orders/summary", getPurchaseOrderSummary);
inventoryRoutes.get(
  "/purchase-orders",
  validate({ query: getPurchaseOrdersQuerySchema }),
  getPurchaseOrders,
);
inventoryRoutes.get(
  "/purchase-orders/:id",
  validate({ params: purchaseOrderIdParamsSchema }),
  getPurchaseOrderById,
);
inventoryRoutes.post(
  "/purchase-orders",
  validate({ body: createPurchaseOrderBodySchema }),
  createPurchaseOrder,
);
inventoryRoutes.patch(
  "/purchase-orders/:id/status",
  validate({
    params: purchaseOrderIdParamsSchema,
    body: updatePurchaseOrderStatusBodySchema,
  }),
  updatePurchaseOrderStatus,
);
inventoryRoutes.delete(
  "/purchase-orders/:id",
  validate({ params: purchaseOrderIdParamsSchema }),
  deletePurchaseOrder,
);
inventoryRoutes.patch(
  "/purchase-orders/:id",
  validate({
    params: purchaseOrderIdParamsSchema,
    body: updatePurchaseOrderBodySchema,
  }),
  updatePurchaseOrder,
);
inventoryRoutes.post(
  "/purchase-orders/:id/receive",
  validate({
    params: purchaseOrderIdParamsSchema,
    body: receivePurchaseOrderStockBodySchema,
  }),
  receivePurchaseOrderStock,
);
inventoryRoutes.post(
  "/purchase-orders/:id/receive-all",
  validate({ params: purchaseOrderIdParamsSchema }),
  receiveAllPurchaseOrderStock,
);

// ------------------------------------------------------------
// Batches — fixed paths before /batches/:id (none right now, but keep the habit)
// ------------------------------------------------------------
inventoryRoutes.get(
  "/batches/expiring",
  validate({ query: getExpiringBatchesQuerySchema }),
  getExpiringBatches,
);
inventoryRoutes.get("/batches/expiry-summary", getExpirySummary);
inventoryRoutes.get(
  "/batches",
  validate({ query: getAllBatchesQuerySchema }),
  getAllBatches,
);

// ------------------------------------------------------------
// Wastage — ALL prefixed with /wastage, fixed paths before /wastage/:id
// ------------------------------------------------------------
inventoryRoutes.get(
  "/wastage/summary",
  validate({ query: getWastageSummaryQuerySchema }),
  getWastageSummary,
);
inventoryRoutes.get("/wastage/reasons", getWastageReasonsBreakdown);
inventoryRoutes.get(
  "/wastage/top-items",
  validate({ query: getTopWastedItemsQuerySchema }),
  getTopWastedItems,
);
inventoryRoutes.get(
  "/wastage/trend",
  validate({ query: getMonthlyWastageTrendQuerySchema }),
  getMonthlyWastageTrend,
);

inventoryRoutes.get(
  "/wastage",
  validate({ query: getWastageRecordsQuerySchema }),
  getWastageRecords,
);
inventoryRoutes.post(
  "/wastage",
  validate({ body: createWastageBodySchema }),
  createWastage,
);

inventoryRoutes.get(
  "/wastage/:id",
  validate({ params: wastageIdParamsSchema }),
  getWastageById,
);
inventoryRoutes.put(
  "/wastage/:id",
  validate({ params: wastageIdParamsSchema, body: updateWastageBodySchema }),
  updateWastage,
);
inventoryRoutes.delete(
  "/wastage/:id",
  validate({ params: wastageIdParamsSchema }),
  deleteWastage,
);

// ------------------------------------------------------------
// Recipes
// ------------------------------------------------------------

inventoryRoutes.get("/recipes", getRecipesController);

inventoryRoutes.get(
  "/recipes/:id",
  validate({ params: recipeIdParamsSchema }),
  getRecipeByIdController,
);

inventoryRoutes.post(
  "/recipes",
  validate({ body: createRecipeBodySchema }),
  createRecipeController,
);

inventoryRoutes.patch(
  "/recipes/:id",
  validate({ params: recipeIdParamsSchema, body: updateRecipeBodySchema }),
  updateRecipeController,
);

inventoryRoutes.delete(
  "/recipes/:id",
  validate({ params: recipeIdParamsSchema }),
  deleteRecipeController,
);

inventoryRoutes.post(
  "/recipes/:id/duplicate",
  validate({ params: recipeIdParamsSchema, body: duplicateRecipeBodySchema }),
  duplicateRecipeController,
);
inventoryRoutes.post(
  "/items",
  validate({ body: createInventoryItemBodySchema }),
  createInventoryItem,
);
inventoryRoutes.get(
  "/items/:id",
  validate({ params: inventoryItemIdParamsSchema }),
  getInventoryItemById,
);
inventoryRoutes.patch(
  "/items/:id",
  validate({
    params: inventoryItemIdParamsSchema,
    body: updateInventoryItemBodySchema,
  }),
  updateInventoryItem,
);
inventoryRoutes.delete(
  "/items/:id",
  validate({ params: inventoryItemIdParamsSchema }),
  deleteInventoryItem,
);

inventoryRoutes.get(
  "/recipes/:id/orders",
  validate({ params: recipeIdParamsSchema, query: getRecipeOrdersQuerySchema }),
  getRecipeOrders,
);
inventoryRoutes.get(
  "/recipes/:id/usage-history",
  validate({ params: recipeIdParamsSchema, query: getRecipeUsageQuerySchema }),
  getRecipeUsage,
);

export default inventoryRoutes;
