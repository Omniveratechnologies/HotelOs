import Inventory from "../models/Inventory.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import inventoryServices from "../services/inventoryServices.js";
import supplierServices from "../services/supplierServices.js";
import purchaseServices from "../services/purchaseServices.js";
import wastageServices from "../services/wastageServices.js";
import stockBatchServices from "../services/stockBatchServices.js";
import * as recipeServices from "../services/recipeServices.js";

export const receiveStock = async (req, res) => {
  try {
    const result = await inventoryServices.receiveStock(req.body);

    res.status(201).json({
      success: true,
      message: "Stock received successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getInventoryItems = async (req, res) => {
  try {
    const items = await Inventory.find().sort({ name: 1 });

    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const purchaseOrders = await PurchaseOrder.find({
          "items.inventoryItem": item._id,
        })
          .populate("supplier", "supplierName supplierCode")
          .sort({ createdAt: -1 });

        const latestPurchaseOrder = purchaseOrders[0];

        let status = "IN STOCK";

        if (item.currentStock <= 0) {
          status = "OUT OF STOCK";
        } else if (item.currentStock <= item.minimumStock) {
          status = "LOW STOCK";
        }

        return {
          ...item.toObject(),

          supplierName: latestPurchaseOrder?.supplier?.supplierName || "-",

          expiryDate: item.expiryDate || null,

          status,
        };
      }),
    );

    res.status(200).json({
      success: true,
      data: enrichedItems,
    });
  } catch (error) {
    console.error("Get inventory items error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const useStock = async (req, res) => {
  try {
    const result = await inventoryServices.useStock(req.body);

    res.status(201).json({
      success: true,
      message: "Stock used successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUsageHistory = async (req, res) => {
  try {
    const usageHistory = await inventoryServices.getUsageHistory();

    res.status(200).json({
      success: true,
      data: usageHistory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPurchaseHistory = async (req, res) => {
  try {
    const purchaseHistory = await inventoryServices.getPurchaseHistory();

    res.status(200).json({
      success: true,
      data: purchaseHistory,
    });
  } catch (error) {
    console.error("Get purchase history error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getLowStockItems = async (req, res) => {
  try {
    const lowStockData = await inventoryServices.getLowStockItems();

    res.status(200).json({
      success: true,
      data: lowStockData,
    });
  } catch (error) {
    console.error("Get low stock items error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSuppliers = async (req, res) => {
  try {
    const { search = "", status = "ALL", category = "ALL" } = req.query;

    const suppliers = await supplierServices.getSuppliers({
      search,
      status,
      category,
    });

    res.status(200).json({
      success: true,
      data: suppliers,
    });
  } catch (error) {
    console.error("Get suppliers error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSupplierById = async (req, res) => {
  try {
    const supplier = await supplierServices.getSupplierById(req.params.id);

    res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    console.error("Get supplier error:", error);

    const statusCode = error.message === "Supplier not found" ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

export const createSupplier = async (req, res) => {
  try {
    const supplier = await supplierServices.createSupplier(req.body);

    res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: supplier,
    });
  } catch (error) {
    console.error("Create supplier error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const supplier = await supplierServices.updateSupplier(
      req.params.id,
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      data: supplier,
    });
  } catch (error) {
    console.error("Update supplier error:", error);

    const statusCode = error.message === "Supplier not found" ? 404 : 400;

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateSupplierStatus = async (req, res) => {
  try {
    const supplier = await supplierServices.updateSupplierStatus(
      req.params.id,
      req.body.status,
    );

    res.status(200).json({
      success: true,
      message: "Supplier status updated successfully",
      data: supplier,
    });
  } catch (error) {
    console.error("Update supplier status error:", error);

    const statusCode = error.message === "Supplier not found" ? 404 : 400;

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const result = await supplierServices.deleteSupplier(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Delete supplier error:", error);

    const statusCode = error.message === "Supplier not found" ? 404 : 400;

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSupplierSummary = async (req, res) => {
  try {
    const summary = await supplierServices.getSupplierSummary();

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Get supplier summary error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createPurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await purchaseServices.createPurchaseOrder(req.body);

    return res.status(201).json({
      success: true,
      message: "Purchase order created successfully",
      data: purchaseOrder,
    });
  } catch (error) {
    console.error("Create purchase order error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPurchaseOrders = async (req, res) => {
  try {
    const purchaseOrders = await purchaseServices.getPurchaseOrders({
      search: req.query.search,
      supplier: req.query.supplier,
      status: req.query.status,
    });

    return res.status(200).json({
      success: true,
      data: purchaseOrders,
    });
  } catch (error) {
    console.error("Get purchase orders error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPurchaseOrderSummary = async (req, res) => {
  try {
    const summary = await purchaseServices.getPurchaseOrderSummary();

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Get purchase order summary error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deletePurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await purchaseServices.deletePurchaseOrder(
      req.params.id,
    );

    return res.status(200).json({
      success: true,
      message: "Purchase order deleted successfully",
      data: purchaseOrder,
    });
  } catch (error) {
    console.error("Delete purchase order error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE: getPurchaseOrderById (404 only when really not found)
export const getPurchaseOrderById = async (req, res) => {
  try {
    const data = await purchaseServices.getPurchaseOrderById(req.params.id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get purchase order error:", error);
    const code = error.message === "Purchase order not found" ? 404 : 500;
    return res.status(code).json({ success: false, message: error.message });
  }
};

// UPDATE: pass the logged-in user for the audit trail
export const updatePurchaseOrderStatus = async (req, res) => {
  try {
    const data = await purchaseServices.updatePurchaseOrderStatus(
      req.params.id,
      req.body.status,
      req.user?._id,
    );
    return res.status(200).json({
      success: true,
      message: "Purchase order status updated successfully",
      data,
    });
  } catch (error) {
    console.error("Update purchase order status error:", error);
    return res
      .status(statusFor(error))
      .json({ success: false, message: error.message });
  }
};

// UPDATE: pass user
export const receivePurchaseOrderStock = async (req, res) => {
  try {
    const data = await inventoryServices.receivePurchaseOrderStock(
      req.params.id,
      req.body,
      req.user?._id,
    );
    return res.status(200).json({
      success: true,
      message: "Purchase order stock received successfully",
      data,
    });
  } catch (error) {
    console.error("Receive purchase order stock error:", error);
    return res
      .status(statusFor(error))
      .json({ success: false, message: error.message });
  }
};

// NEW: Mark as Received (receive everything remaining)
export const receiveAllPurchaseOrderStock = async (req, res) => {
  try {
    const data = await inventoryServices.receiveAllPurchaseOrderStock(
      req.params.id,
      req.body,
      req.user?._id,
    );
    return res.status(200).json({
      success: true,
      message: "All remaining stock received successfully",
      data,
    });
  } catch (error) {
    console.error("Receive all purchase order stock error:", error);
    return res
      .status(statusFor(error))
      .json({ success: false, message: error.message });
  }
};
export const updatePurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await purchaseServices.updatePurchaseOrder(
      req.params.id,
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "Purchase order updated successfully",
      data: purchaseOrder,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
export const adjustStock = async (req, res) => {
  try {
    const result = await inventoryServices.adjustStock(req.body);

    return res.status(200).json({
      success: true,
      message: "Stock adjusted successfully",
      data: result,
    });
  } catch (error) {
    console.error("Adjust stock error:", error);

    const statusCode = error.message === "Inventory item not found" ? 404 : 400;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const statusFor = (error) =>
  error.message === "Wastage record not found" ? 404 : 400;

export const createWastage = async (req, res) => {
  try {
    const data = await wastageServices.createWastage(req.body);
    return res.status(201).json({
      success: true,
      message: "Wastage recorded successfully",
      data,
    });
  } catch (error) {
    console.error("Create wastage error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateWastage = async (req, res) => {
  try {
    const data = await wastageServices.updateWastage(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: "Wastage record updated successfully",
      data,
    });
  } catch (error) {
    console.error("Update wastage error:", error);
    return res
      .status(statusFor(error))
      .json({ success: false, message: error.message });
  }
};

export const deleteWastage = async (req, res) => {
  try {
    const data = await wastageServices.deleteWastage(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Wastage record deleted successfully",
      data,
    });
  } catch (error) {
    console.error("Delete wastage error:", error);
    return res
      .status(statusFor(error))
      .json({ success: false, message: error.message });
  }
};

export const getWastageRecords = async (req, res) => {
  try {
    const data = await wastageServices.getWastageRecords({
      search: req.query.search,
      reason: req.query.reason,
      department: req.query.department,
      period: req.query.period,
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get wastage records error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getWastageById = async (req, res) => {
  try {
    const data = await wastageServices.getWastageById(req.params.id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get wastage error:", error);
    return res
      .status(statusFor(error))
      .json({ success: false, message: error.message });
  }
};

export const getWastageSummary = async (req, res) => {
  try {
    const data = await wastageServices.getWastageSummary({
      period: req.query.period,
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get wastage summary error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getWastageReasonsBreakdown = async (req, res) => {
  try {
    const data = await wastageServices.getWastageReasonsBreakdown({
      period: req.query.period,
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get wastage reasons error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getTopWastedItems = async (req, res) => {
  try {
    const data = await wastageServices.getTopWastedItems({
      period: req.query.period,
      limit: req.query.limit,
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get top wasted items error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMonthlyWastageTrend = async (req, res) => {
  try {
    const data = await wastageServices.getMonthlyWastageTrend({
      months: req.query.months,
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get monthly wastage trend error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getExpiringBatches = async (req, res) => {
  try {
    const data = await stockBatchServices.getExpiringBatches({
      days: req.query.days,
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get expiring batches error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getExpirySummary = async (req, res) => {
  try {
    const data = await stockBatchServices.getExpirySummary();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get expiry summary error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllBatches = async (req, res) => {
  try {
    const data = await stockBatchServices.getAllBatches({
      search: req.query.search,
      groupByItem: req.query.groupByItem === "true",
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get all batches error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecipesController = async (req, res) => {
  try {
    const recipes = await recipeServices.getRecipes();
    return res.status(200).json({ success: true, data: recipes });
  } catch (error) {
    console.error("Get recipes error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recipes",
      error: error.message,
    });
  }
};

export const getRecipeByIdController = async (req, res) => {
  try {
    const recipe = await recipeServices.getRecipeById(req.params.id);
    return res.status(200).json({ success: true, data: recipe });
  } catch (error) {
    console.error("Get recipe by ID error:", error);
    if (error.message === "Recipe not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recipe",
      error: error.message,
    });
  }
};

export const createRecipeController = async (req, res) => {
  try {
    const recipe = await recipeServices.createRecipe(req.body);
    return res.status(201).json({
      success: true,
      message: "Recipe created successfully",
      data: recipe,
    });
  } catch (error) {
    console.error("Create recipe error:", error);
    return res.status(400).json({
      success: false,
      message: "Failed to create recipe",
      error: error.message,
    });
  }
};

export const updateRecipeController = async (req, res) => {
  try {
    const recipe = await recipeServices.updateRecipe(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: "Recipe updated successfully",
      data: recipe,
    });
  } catch (error) {
    console.error("Update recipe error:", error);
    if (error.message === "Recipe not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(400).json({
      success: false,
      message: "Failed to update recipe",
      error: error.message,
    });
  }
};

export const deleteRecipeController = async (req, res) => {
  try {
    await recipeServices.deleteRecipe(req.params.id);
    return res
      .status(200)
      .json({ success: true, message: "Recipe deleted successfully" });
  } catch (error) {
    console.error("Delete recipe error:", error);
    if (error.message === "Recipe not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to delete recipe",
      error: error.message,
    });
  }
};

export const duplicateRecipeController = async (req, res) => {
  try {
    const recipe = await recipeServices.duplicateRecipe(req.params.id);
    return res.status(201).json({
      success: true,
      message: "Recipe duplicated successfully",
      data: recipe,
    });
  } catch (error) {
    console.error("Duplicate recipe error:", error);
    if (error.message === "Recipe not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to duplicate recipe",
      error: error.message,
    });
  }
};

export const createInventoryItem = async (req, res) => {
  try {
    const { name, category, unit, minimumStock, costPerUnit, expiryDate } =
      req.body;

    if (!name || !category || !unit) {
      return res.status(400).json({
        success: false,
        message: "Name, category and unit are required",
      });
    }

    const existingItem = await Inventory.findOne({
      name: name.trim(),
    });

    if (existingItem) {
      return res.status(409).json({
        success: false,
        message: "Inventory item already exists",
      });
    }

    const item = await Inventory.create({
      name: name.trim(),
      category: category.trim(),
      unit: unit.trim(),
      currentStock: 0,
      minimumStock: Number(minimumStock || 0),
      costPerUnit: Number(costPerUnit || 0),
      expiryDate: expiryDate || null,
    });

    return res.status(201).json({
      success: true,
      message: "Inventory item created successfully",
      data: item,
    });
  } catch (error) {
    console.error("Create inventory item error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getInventoryItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Inventory.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;

    const { name, category, unit, minimumStock, costPerUnit, expiryDate } =
      req.body;

    const item = await Inventory.findByIdAndUpdate(
      id,
      {
        name: name?.trim(),
        category: category?.trim(),
        unit: unit?.trim(),
        minimumStock: Number(minimumStock || 0),
        costPerUnit: Number(costPerUnit || 0),
        expiryDate: expiryDate || null,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Inventory item updated successfully",
      data: item,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Inventory item already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Inventory.findByIdAndDelete(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Inventory item deleted successfully",
    });
  } catch (error) {
    console.error("Delete inventory item error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getRecipeOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const result = await getRecipeOrderHistory(id, {
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error(error, "Get recipe order history error");

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch recipe orders",
    });
  }
};

export const getRecipeUsage = async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;

    const data = await getRecipeUsageHistory(id, days);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error(error, "Get recipe usage history error");

    const statusCode = error.message === "Recipe not found" ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to fetch recipe usage",
    });
  }
};
