import "dotenv/config";
import mongoose from "mongoose";
import Inventory from "#/modules/inventory/models/Inventory.js";
import logger from "#/utils/logger.js";

const inventoryItems = [
  {
    name: "Tomato",
    category: "Vegetables",
    currentStock: 50,
    unit: "kg",
    minimumStock: 10,
    costPerUnit: 25,
  },
  {
    name: "Onion",
    category: "Vegetables",
    currentStock: 40,
    unit: "kg",
    minimumStock: 10,
    costPerUnit: 60,
  },
  {
    name: "Potato",
    category: "Vegetables",
    currentStock: 60,
    unit: "kg",
    minimumStock: 15,
    costPerUnit: 30,
  },
  {
    name: "Carrot",
    category: "Vegetables",
    currentStock: 25,
    unit: "kg",
    minimumStock: 5,
    costPerUnit: 120,
  },
  {
    name: "Capsicum",
    category: "Vegetables",
    currentStock: 20,
    unit: "kg",
    minimumStock: 5,
    costPerUnit: 50,
  },
  {
    name: "Chicken",
    category: "Meat",
    currentStock: 30,
    unit: "kg",
    minimumStock: 8,
    costPerUnit: 200,
  },
  {
    name: "Paneer",
    category: "Dairy",
    currentStock: 15,
    unit: "kg",
    minimumStock: 5,
    costPerUnit: 285,
  },
  {
    name: "Milk",
    category: "Dairy",
    currentStock: 25,
    unit: "litre",
    minimumStock: 8,
    costPerUnit: 125,
  },
  {
    name: "Butter",
    category: "Dairy",
    currentStock: 10,
    unit: "kg",
    minimumStock: 3,
    costPerUnit: 120,
  },
  {
    name: "Rice",
    category: "Grains",
    currentStock: 100,
    unit: "kg",
    minimumStock: 25,
    costPerUnit: 105,
  },
  {
    name: "Wheat Flour",
    category: "Grains",
    currentStock: 75,
    unit: "kg",
    minimumStock: 20,
    costPerUnit: 45,
  },
  {
    name: "Cooking Oil",
    category: "Oils",
    currentStock: 40,
    unit: "litre",
    minimumStock: 10,
    costPerUnit: 100,
  },
  {
    name: "Salt",
    category: "Spices",
    currentStock: 20,
    unit: "kg",
    minimumStock: 5,
    costPerUnit: 30,
  },
  {
    name: "Black Pepper",
    category: "Spices",
    currentStock: 5,
    unit: "kg",
    minimumStock: 2,
    costPerUnit: 185,
  },
  {
    name: "Sugar",
    category: "Sweeteners",
    currentStock: 30,
    unit: "kg",
    minimumStock: 8,
    costPerUnit: 60,
  },
];

const seedInventoryItems = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("MongoDB connected");

    await Inventory.bulkWrite(
      inventoryItems.map((item) => ({
        updateOne: {
          filter: { name: item.name },
          update: {
            $set: {
              category: item.category,
              unit: item.unit,
              minimumStock: item.minimumStock,
              costPerUnit: item.costPerUnit,
            },
          },
          upsert: true,
        },
      })),
    );

    logger.info("Inventory items seeded/updated successfully!");

    process.exit(0);
  } catch (error) {
    logger.error(error, "Failed to seed inventory items");
    process.exit(1);
  }
};

seedInventoryItems();
