import { z } from "zod";
import { flexibleDateOptionalSchema } from "#/shared/schemas/common.js";

const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// =====================================================
// INVENTORY ITEM SCHEMAS
// =====================================================

export const createInventoryItemBodySchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Unit is required"),
  minimumStock: z.number().nonnegative().default(0),
  costPerUnit: z.number().nonnegative().default(0),
  expiryDate: flexibleDateOptionalSchema,
});

export const updateInventoryItemBodySchema = z
  .object({
    name: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    unit: z.string().min(1).optional(),
    minimumStock: z.number().nonnegative().optional(),
    costPerUnit: z.number().nonnegative().optional(),
    expiryDate: flexibleDateOptionalSchema,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const receiveStockBodySchema = z
  .object({
    inventoryItem: mongoIdSchema,
    quantity: z.number().int().positive("Quantity must be positive"),
    unitCost: z.number().nonnegative().optional(),
    supplier: mongoIdSchema.optional(),
    purchaseOrder: mongoIdSchema.optional(),
    batchNumber: z.string().optional(),
    expiryDate: flexibleDateOptionalSchema,
  })
  .refine((data) => data.supplier || data.purchaseOrder, {
    message: "Either supplier or purchaseOrder is required",
    path: ["supplier"],
  });

export const useStockBodySchema = z.object({
  inventoryItem: mongoIdSchema,
  quantity: z.number().int().positive("Quantity must be positive"),
  department: z.string().optional(),
  reason: z.string().optional(),
  recipe: mongoIdSchema.optional(),
});

export const getUsageHistoryQuerySchema = z.object({
  item: mongoIdSchema.optional(),
  department: z.string().optional(),
  startDate: flexibleDateOptionalSchema,
  endDate: flexibleDateOptionalSchema,
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const getPurchaseHistoryQuerySchema = z.object({
  item: mongoIdSchema.optional(),
  supplier: mongoIdSchema.optional(),
  startDate: flexibleDateOptionalSchema,
  endDate: flexibleDateOptionalSchema,
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const adjustStockBodySchema = z.object({
  inventoryItem: mongoIdSchema,
  newQuantity: z.number().int().nonnegative("Quantity must be non-negative"),
  reason: z.string().optional(),
});

// =====================================================
// SUPPLIER SCHEMAS
// =====================================================

const supplierStatusSchema = z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]);
const supplierCategorySchema = z.enum([
  "FOOD",
  "BEVERAGE",
  "CLEANING",
  "LINEN",
  "EQUIPMENT",
  "OTHER",
]);

export const createSupplierBodySchema = z.object({
  supplierCode: z.string().min(1, "Supplier code is required"),
  supplierName: z.string().min(1, "Supplier name is required"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  gstin: z.string().optional(),
  category: supplierCategorySchema.default("OTHER"),
  paymentTerms: z.string().optional(),
  status: supplierStatusSchema.default("ACTIVE"),
  notes: z.string().optional(),
});

export const updateSupplierBodySchema = z
  .object({
    supplierCode: z.string().min(1).optional(),
    supplierName: z.string().min(1).optional(),
    contactPerson: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Invalid email").optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    gstin: z.string().optional(),
    category: supplierCategorySchema.optional(),
    paymentTerms: z.string().optional(),
    status: supplierStatusSchema.optional(),
    notes: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const updateSupplierStatusBodySchema = z.object({
  status: supplierStatusSchema,
});

export const getSuppliersQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED", "ALL"]).default("ALL"),
  category: z
    .enum([
      "FOOD",
      "BEVERAGE",
      "CLEANING",
      "LINEN",
      "EQUIPMENT",
      "OTHER",
      "ALL",
    ])
    .default("ALL"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// =====================================================
// PURCHASE ORDER SCHEMAS
// =====================================================

const purchaseOrderStatusSchema = z.enum([
  "DRAFT",
  "SENT",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CANCELLED",
]);

export const createPurchaseOrderBodySchema = z.object({
  supplier: mongoIdSchema,
  items: z
    .array(
      z.object({
        inventoryItem: mongoIdSchema,
        quantity: z.number().int().positive(),
        unitCost: z.number().nonnegative(),
        taxPercent: z.number().nonnegative().default(0),
      }),
    )
    .min(1, "At least one item is required"),
  expectedDeliveryDate: flexibleDateOptionalSchema,
  notes: z.string().optional(),
});

export const updatePurchaseOrderBodySchema = z
  .object({
    supplier: mongoIdSchema.optional(),
    items: z
      .array(
        z.object({
          inventoryItem: mongoIdSchema,
          quantity: z.number().int().positive(),
          unitCost: z.number().nonnegative(),
          taxPercent: z.number().nonnegative().default(0),
        }),
      )
      .optional(),
    expectedDeliveryDate: flexibleDateOptionalSchema,
    notes: z.string().optional(),
    status: purchaseOrderStatusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const updatePurchaseOrderStatusBodySchema = z.object({
  status: purchaseOrderStatusSchema,
});

export const receivePurchaseOrderStockBodySchema = z.object({
  receivedItems: z
    .array(
      z.object({
        purchaseOrderItemId: mongoIdSchema,
        quantityReceived: z.number().int().positive(),
        batchNumber: z.string().optional(),
        expiryDate: flexibleDateOptionalSchema,
      }),
    )
    .min(1),
  receivedBy: mongoIdSchema.optional(),
});

export const getPurchaseOrdersQuerySchema = z.object({
  search: z.string().optional(),
  supplier: mongoIdSchema.optional(),
  status: purchaseOrderStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// =====================================================
// WASTAGE SCHEMAS
// =====================================================

const wastageReasonSchema = z.enum([
  "SPOILAGE",
  "EXPIRED",
  "BREAKAGE",
  "OVER_PRODUCTION",
  "CONTAMINATION",
  "OTHER",
]);

export const createWastageBodySchema = z.object({
  inventoryItem: mongoIdSchema,
  quantity: z.number().int().positive("Quantity must be positive"),
  reason: wastageReasonSchema,
  department: z.string().optional(),
  notes: z.string().optional(),
  cost: z.number().nonnegative().optional(),
  wastageDate: flexibleDateOptionalSchema,
});

export const updateWastageBodySchema = z
  .object({
    quantity: z.number().int().positive().optional(),
    reason: wastageReasonSchema.optional(),
    department: z.string().optional(),
    notes: z.string().optional(),
    cost: z.number().nonnegative().optional(),
    wastageDate: flexibleDateOptionalSchema,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const getWastageRecordsQuerySchema = z.object({
  search: z.string().optional(),
  reason: wastageReasonSchema.optional(),
  department: z.string().optional(),
  period: z
    .enum(["today", "week", "month", "quarter", "year", "custom"])
    .optional(),
  startDate: flexibleDateOptionalSchema,
  endDate: flexibleDateOptionalSchema,
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const getWastageSummaryQuerySchema = z.object({
  period: z
    .enum(["today", "week", "month", "quarter", "year", "custom"])
    .optional(),
  startDate: flexibleDateOptionalSchema,
  endDate: flexibleDateOptionalSchema,
});

export const getTopWastedItemsQuerySchema = z.object({
  period: z
    .enum(["today", "week", "month", "quarter", "year", "custom"])
    .optional(),
  limit: z.coerce.number().int().positive().max(100).default(10),
  startDate: flexibleDateOptionalSchema,
  endDate: flexibleDateOptionalSchema,
});

export const getMonthlyWastageTrendQuerySchema = z.object({
  months: z.coerce.number().int().positive().max(24).default(12),
});

// =====================================================
// STOCK BATCH SCHEMAS
// =====================================================

export const getExpiringBatchesQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(365).default(30),
});

export const getAllBatchesQuerySchema = z.object({
  search: z.string().optional(),
  groupByItem: z.enum(["true", "false"]).default("false"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// =====================================================
// RECIPE SCHEMAS
// =====================================================

export const createRecipeBodySchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  category: z.string().optional(),
  description: z.string().optional(),
  ingredients: z
    .array(
      z.object({
        inventoryItem: mongoIdSchema,
        quantity: z.number().nonnegative(),
        unit: z.string(),
      }),
    )
    .min(1, "At least one ingredient is required"),
  instructions: z.string().optional(),
  preparationTime: z.number().int().positive().optional(),
  cookingTime: z.number().int().positive().optional(),
  servings: z.number().int().positive().default(1),
  costPerServing: z.number().nonnegative().optional(),
  image: z.string().url("Invalid image URL").optional(),
});

export const updateRecipeBodySchema = z
  .object({
    name: z.string().min(1).optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    ingredients: z
      .array(
        z.object({
          inventoryItem: mongoIdSchema,
          quantity: z.number().nonnegative(),
          unit: z.string(),
        }),
      )
      .optional(),
    instructions: z.string().optional(),
    preparationTime: z.number().int().positive().optional(),
    cookingTime: z.number().int().positive().optional(),
    servings: z.number().int().positive().optional(),
    costPerServing: z.number().nonnegative().optional(),
    image: z.string().url("Invalid image URL").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const duplicateRecipeBodySchema = z.object({});

// =====================================================
// RECIPE ORDERS / USAGE HISTORY
// =====================================================

export const getRecipeOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const getRecipeUsageQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(365).default(30),
});

// =====================================================
// PARAMS SCHEMAS
// =====================================================

export const inventoryItemIdParamsSchema = z.object({
  id: mongoIdSchema,
});

export const supplierIdParamsSchema = z.object({
  id: mongoIdSchema,
});

export const purchaseOrderIdParamsSchema = z.object({
  id: mongoIdSchema,
});

export const wastageIdParamsSchema = z.object({
  id: mongoIdSchema,
});

export const recipeIdParamsSchema = z.object({
  id: mongoIdSchema,
});

export const purchaseOrderItemIdParamsSchema = z.object({
  id: mongoIdSchema,
  itemId: mongoIdSchema,
});
