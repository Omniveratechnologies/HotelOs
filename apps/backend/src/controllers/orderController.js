// Created by: Jinetta Shree

import FoodOrder from "../models/FoodOrder.js";
// Purpose: Fetches all food orders for the Kitchen Dashboard (GET /api/orders)
const getOrders = async (req, res) => {
  try {
    const orders = await FoodOrder.find();

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
};

// Purpose: Fetches a single food order by ID (GET /api/orders/:id)
const getOrderById = async (req, res) => {
  try {
    const order = await FoodOrder.findById(req.params.id);

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch order",
    });
  }
};

// Purpose: Creates a new food order (POST /api/orders)
const createOrder = async (req, res) => {
  console.log("REQUEST BODY:", req.body);

  try {
    const order = await FoodOrder.create(req.body);

    res.status(201).json(order);
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);

    res.status(500).json({
      message: "Failed to create order",
    });
  }
};

// Purpose: Updates the status of an existing food order (PATCH /api/orders/:id/status)
const updateOrderStatus = async (req, res) => {
  console.log("PATCH BODY:", req.body);

  try {
    const order = await FoodOrder.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true },
    );

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

// Purpose: Deletes a food order by ID (DELETE /api/orders/:id)
const deleteOrder = async (req, res) => {
  console.log("Deleted:", req.params.id);

  try {
    await FoodOrder.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Order deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete order",
      error: error.message,
    });
  }
};

export { getOrders, getOrderById, createOrder, updateOrderStatus, deleteOrder };
