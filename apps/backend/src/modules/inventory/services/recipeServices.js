import Order from "../../orders/models/Order.js";

import Recipe from "../models/Recipe.js";
import Inventory from "../models/Inventory.js";

const roundValue = (value) => Number(Number(value || 0).toFixed(2));

const convertToInventoryUnit = (quantity, recipeUnit, inventoryUnit) => {
  const value = Number(quantity || 0);

  if (!value) return 0;
  if (recipeUnit === inventoryUnit) return value;

  if (recipeUnit === "g" && inventoryUnit === "kg") return value / 1000;
  if (recipeUnit === "kg" && inventoryUnit === "g") return value * 1000;
  if (recipeUnit === "ml" && inventoryUnit === "litre") return value / 1000;
  if (recipeUnit === "litre" && inventoryUnit === "ml") return value * 1000;

  return value;
};

const calculateRecipeCosts = (recipe) => {
  const totalIngredientCost = recipe.ingredients.reduce(
    (total, ingredient) => total + Number(ingredient.totalCost || 0),
    0,
  );

  const packagingCost = Number(recipe.packagingCost || 0);
  const preparationOverhead = Number(recipe.preparationOverhead || 0);

  const totalFoodCost =
    totalIngredientCost + packagingCost + preparationOverhead;

  const sellingPrice = Number(recipe.sellingPrice || 0);

  const foodCostPercentage =
    sellingPrice > 0 ? (totalFoodCost / sellingPrice) * 100 : 0;

  const profitAmount = sellingPrice - totalFoodCost;

  const profitMarginPercentage =
    sellingPrice > 0 ? (profitAmount / sellingPrice) * 100 : 0;

  return {
    totalIngredientCost: roundValue(totalIngredientCost),
    totalFoodCost: roundValue(totalFoodCost),
    foodCostPercentage: roundValue(foodCostPercentage),
    profitAmount: roundValue(profitAmount),
    profitMarginPercentage: roundValue(profitMarginPercentage),
  };
};

const prepareIngredients = async (ingredients = []) => {
  return Promise.all(
    ingredients.map(async (ingredient) => {
      const inventoryItem = await Inventory.findById(ingredient.inventoryItem);

      if (!inventoryItem) {
        throw new Error(
          `Inventory item not found: ${ingredient.inventoryItem}`,
        );
      }

      const quantityPerServing = Number(ingredient.quantityPerServing || 0);
      const recipeUnit = ingredient.unit || inventoryItem.unit;
      const inventoryUnit = inventoryItem.unit;

      const costPerUnit = Number(inventoryItem.costPerUnit || 0);

      const quantityInInventoryUnit = convertToInventoryUnit(
        quantityPerServing,
        recipeUnit,
        inventoryUnit,
      );

      const totalCost = quantityInInventoryUnit * costPerUnit;

      return {
        inventoryItem: inventoryItem._id,
        quantityPerServing,
        unit: recipeUnit,
        costPerUnit: roundValue(costPerUnit),
        totalCost: roundValue(totalCost),
      };
    }),
  );
};

export const getRecipes = async () => {
  return Recipe.find()
    .populate("ingredients.inventoryItem", "name category unit costPerUnit")
    .sort({ createdAt: -1 });
};

export const getRecipeById = async (recipeId) => {
  const recipe = await Recipe.findById(recipeId).populate(
    "ingredients.inventoryItem",
    "name category unit costPerUnit",
  );

  if (!recipe) {
    throw new Error("Recipe not found");
  }

  return recipe;
};

export const createRecipe = async (recipeData) => {
  const ingredients = await prepareIngredients(recipeData.ingredients);

  const recipe = new Recipe({
    ...recipeData,
    ingredients,
  });

  const costs = calculateRecipeCosts(recipe);

  Object.assign(recipe, costs);

  return recipe.save();
};

export const updateRecipe = async (recipeId, recipeData) => {
  const recipe = await Recipe.findById(recipeId);

  if (!recipe) {
    throw new Error("Recipe not found");
  }

  if (recipeData.ingredients) {
    recipeData.ingredients = await prepareIngredients(recipeData.ingredients);
  }

  Object.assign(recipe, recipeData);

  const costs = calculateRecipeCosts(recipe);

  Object.assign(recipe, costs);

  await recipe.save();

  return Recipe.findById(recipeId).populate(
    "ingredients.inventoryItem",
    "name category unit costPerUnit",
  );
};

export const deleteRecipe = async (recipeId) => {
  const recipe = await Recipe.findByIdAndDelete(recipeId);

  if (!recipe) {
    throw new Error("Recipe not found");
  }

  return recipe;
};

export const duplicateRecipe = async (recipeId) => {
  const recipe = await Recipe.findById(recipeId).lean();

  if (!recipe) {
    throw new Error("Recipe not found");
  }

  const { _id, createdAt: _createdAt, updatedAt: _updatedAt, ...recipeData } = recipe;

  recipeData.menuItemName = `${recipeData.menuItemName} Copy`;

  const duplicatedRecipe = await Recipe.create(recipeData);

  return Recipe.findById(duplicatedRecipe._id).populate(
    "ingredients.inventoryItem",
    "name category unit costPerUnit",
  );
};

export const getRecipeOrderHistory = async (
  recipeId,
  { page = 1, limit = 10 } = {},
) => {
  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 100);

  const orders = await Order.find({
    "items.recipeId": recipeId,
  })
    .populate("guestId", "name")
    .populate("roomId", "roomNumber")
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber)
    .lean();

  const total = await Order.countDocuments({
    "items.recipeId": recipeId,
  });

  const data = orders.flatMap((order) => {
    const recipeItems = order.items.filter(
      (item) => item.recipeId?.toString() === recipeId.toString(),
    );

    return recipeItems.map((item) => ({
      orderId: order._id,
      guestName: order.guestId?.name || "Unknown Guest",
      roomNumber: order.roomId?.roomNumber || "-",
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity,
      status: order.status,
      paymentStatus: order.paymentStatus,
      orderedAt: order.createdAt,
    }));
  });

  return {
    data,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
};

export const getRecipeUsageHistory = async (recipeId, days = 30) => {
  const recipe = await Recipe.findById(recipeId).lean();

  if (!recipe) {
    throw new Error("Recipe not found");
  }

  const daysNumber = Math.max(Number(days) || 30, 1);

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - daysNumber);

  const orders = await Order.find({
    "items.recipeId": recipeId,
    createdAt: { $gte: fromDate },
  })
    .sort({ createdAt: -1 })
    .lean();

  const usageMap = new Map();

  for (const order of orders) {
    for (const orderItem of order.items || []) {
      if (
        !orderItem.recipeId ||
        orderItem.recipeId.toString() !== recipeId.toString()
      ) {
        continue;
      }

      const orderedQuantity = Number(orderItem.quantity || 0);

      for (const ingredient of recipe.ingredients || []) {
        const inventoryItemId = ingredient.inventoryItem?.toString();

        if (!inventoryItemId) continue;

        const usedQuantity =
          Number(ingredient.quantityPerServing || 0) * orderedQuantity;

        const existing = usageMap.get(inventoryItemId);

        if (existing) {
          existing.quantityUsed += usedQuantity;
        } else {
          usageMap.set(inventoryItemId, {
            inventoryItem: ingredient.inventoryItem,
            itemName: null,
            quantityUsed: usedQuantity,
            unit: ingredient.unit,
          });
        }
      }
    }
  }

  const inventoryItemIds = [...usageMap.keys()];

  const inventoryItems = await Inventory.find({
    _id: { $in: inventoryItemIds },
  })
    .select("name unit")
    .lean();

  const inventoryMap = new Map(
    inventoryItems.map((item) => [item._id.toString(), item]),
  );

  return [...usageMap.values()].map((usage) => {
    const inventoryItem = inventoryMap.get(usage.inventoryItem.toString());

    return {
      inventoryItem: usage.inventoryItem,
      itemName: inventoryItem?.name || "Unknown Item",
      quantityUsed: roundValue(usage.quantityUsed),
      unit: usage.unit || inventoryItem?.unit || "",
    };
  });
};
