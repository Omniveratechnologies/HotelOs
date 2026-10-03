import mongoose from "mongoose";
import "dotenv/config";

import Recipe from "../modules/inventory/models/Recipe.js";
import Inventory from "../modules/inventory/models/Inventory.js";

const recipeSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected");

    const ingredientNames = [
      "Chicken (Boneless)",
      "Tomatoes",
      "Butter",
      "Cream",
      "Garam Masala",
      "Cooking Oil",
    ];

    const inventoryItems = await Inventory.find({
      name: { $in: ingredientNames },
    });

    const inventoryMap = new Map(
      inventoryItems.map((item) => [item.name, item]),
    );

    const missingIngredients = ingredientNames.filter(
      (name) => !inventoryMap.has(name),
    );

    if (missingIngredients.length) {
      throw new Error(
        `Missing inventory items: ${missingIngredients.join(", ")}`,
      );
    }

    const ingredients = [
      {
        name: "Chicken (Boneless)",
        quantityPerServing: 250,
        unit: "g",
      },
      {
        name: "Tomatoes",
        quantityPerServing: 100,
        unit: "g",
      },
      {
        name: "Butter",
        quantityPerServing: 30,
        unit: "g",
      },
      {
        name: "Cream",
        quantityPerServing: 50,
        unit: "ml",
      },
      {
        name: "Garam Masala",
        quantityPerServing: 10,
        unit: "g",
      },
      {
        name: "Cooking Oil",
        quantityPerServing: 20,
        unit: "ml",
      },
    ].map((ingredient) => {
      const inventoryItem = inventoryMap.get(ingredient.name);

      const costPerUnit = Number(inventoryItem.costPerUnit || 0);

      const totalCost = ingredient.quantityPerServing * costPerUnit;

      return {
        inventoryItem: inventoryItem._id,
        quantityPerServing: ingredient.quantityPerServing,
        unit: ingredient.unit,
        costPerUnit,
        totalCost,
      };
    });

    const totalIngredientCost = ingredients.reduce(
      (total, ingredient) => total + ingredient.totalCost,
      0,
    );

    const packagingCost = 5;
    const preparationOverhead = 8;

    const totalFoodCost =
      totalIngredientCost + packagingCost + preparationOverhead;

    const sellingPrice = 350;

    const foodCostPercentage = (totalFoodCost / sellingPrice) * 100;

    const profitAmount = sellingPrice - totalFoodCost;

    const profitMarginPercentage = (profitAmount / sellingPrice) * 100;

    const existingRecipe = await Recipe.findOne({
      menuItemName: "Butter Chicken",
    });

    if (existingRecipe) {
      console.log("Butter Chicken recipe already exists");
      return;
    }

    await Recipe.create({
      menuItemName: "Butter Chicken",
      category: "Main Course",

      servingSize: 1,
      servingUnit: "plate",

      preparationTime: 25,
      preparationTimeUnit: "minutes",

      cuisineType: "Indian",
      difficultyLevel: "Medium",

      sellingPrice: 350,

      description:
        "Classic North Indian dish with tender chicken in rich, creamy tomato gravy and aromatic spices.",

      imageUrl: "",

      isActive: true,

      ingredients,

      packagingCost,
      preparationOverhead,

      totalIngredientCost,
      totalFoodCost,

      foodCostPercentage,
      profitAmount,
      profitMarginPercentage,
    });

    console.log("Butter Chicken recipe seeded");
  } catch (error) {
    console.error("Recipe seed failed:", error);
  } finally {
    await mongoose.disconnect();
  }
};

recipeSeed();
