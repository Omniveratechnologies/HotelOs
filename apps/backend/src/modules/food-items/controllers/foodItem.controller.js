import FoodItem from "../models/FoodItem.js";
import { foodItemDTO } from "../dto/foodItem.dto.js";
import logger from "#/utils/logger.js";

// GET /api/v1/food-items — any authenticated role can view
export const getFoodItems = async (req, res) => {
  try {
    const items = await FoodItem.find({ hotelId: req.user.hotelId });
    return res
      .status(200)
      .json({ success: true, data: items.map(foodItemDTO) });
  } catch (error) {
    logger.error(error, "Get food items error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch food items" });
  }
};
export const getPublicFoodItems = async (req, res) => {
  try {
    const items = await FoodItem.find({
      hotelId: req.params.hotelId,
      isAvailable: true,
    });
    return res
      .status(200)
      .json({ success: true, data: items.map(foodItemDTO) });
  } catch (error) {
    logger.error(error, "Get public food items error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch menu" });
  }
};
// POST /api/v1/food-items — SUB_ADMIN/KITCHEN only.
// Included here ONLY so you can seed test menu items locally.
// Do not build guest-facing UI for this endpoint.
export const createFoodItem = async (req, res) => {
  try {
    const { name, description, price, category, image } = req.body;

    if (!name || price === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "name and price are required" });
    }

    const item = await FoodItem.create({
      name,
      description,
      price,
      category,
      image,
      hotelId: req.user.hotelId,
    });

    return res.status(201).json({
      success: true,
      message: "Food item created successfully",
      data: foodItemDTO(item),
    });
  } catch (error) {
    logger.error(error, "Create food item error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to create food item" });
  }
};

export const updateFoodItem = async (req, res) => {
  try {
    const item = await FoodItem.findOneAndUpdate(
      { _id: req.params.id, hotelId: req.user.hotelId },
      { $set: req.body },
      { new: true, runValidators: true },
    );
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Food item not found" });
    return res.json({ success: true, data: foodItemDTO(item) });
  } catch (error) {
    logger.error(error, "Update food item error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to update food item" });
  }
};

export const deleteFoodItem = async (req, res) => {
  try {
    const item = await FoodItem.findOneAndDelete({
      _id: req.params.id,
      hotelId: req.user.hotelId,
    });
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Food item not found" });
    return res.json({
      success: true,
      message: "Food item deleted successfully",
    });
  } catch (error) {
    logger.error(error, "Delete food item error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete food item" });
  }
};
