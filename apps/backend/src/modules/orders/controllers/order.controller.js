import crypto from "crypto";
import Order from "../models/Order.js";
import FoodItem from "#/modules/food-items/models/FoodItem.js";
import Room from "#/modules/rooms/models/Room.js";
import getRazorpay from "#/config/razorpay.js";
import { orderDTO } from "../dto/order.dto.js";
import logger from "#/utils/logger.js";

// Normalize a kitchen-facing status value (spaces / display casing) into the
// canonical Order enum stored on the model.
function normalizeStatus(value) {
  if (!value) return value;
  const map = {
    "out for delivery": "OUT_FOR_DELIVERY",
    "OUT FOR DELIVERY": "OUT_FOR_DELIVERY",
    delivered: "DELIVERED",
    Delivered: "DELIVERED",
    new: "NEW",
    preparing: "PREPARING",
    ready: "READY",
    rejected: "REJECTED",
    cancelled: "CANCELLED",
  };
  return map[value] || value;
}

// Compute a human readable "age" string from createdAt (e.g. "5 min").
function formatAge(createdAt) {
  if (!createdAt) return "";
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr`;
  return `${Math.floor(hours / 24)}d`;
}

// Kitchen-friendly payload: denormalized roomNumber, computed age, status kept
// in the display form the kitchen UI uses ("OUT FOR DELIVERY").
function kitchenOrderDTO(order, room) {
  const statusDisplay =
    order.status === "OUT_FOR_DELIVERY" ? "OUT FOR DELIVERY" : order.status;

  return {
    _id: order._id,
    id: order._id,
    roomNumber: room ? room.roomNumber : order.roomId || null,
    age: formatAge(order.createdAt),
    status: statusDisplay,
    paymentMethod: order.paymentMethod,
    items: (order.items || []).map((item) => ({
      _id: item._id || item.foodItemId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export const createOrder = async (req, res) => {
  try {
    const { items, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "items are required" });
    }

    const foodItems = await FoodItem.find({
      _id: { $in: items.map((i) => i.foodItemId) },
    });

    let totalAmount = 0;
    const orderItems = items.map((reqItem) => {
      const foodItem = foodItems.find(
        (f) => f._id.toString() === reqItem.foodItemId,
      );
      if (!foodItem)
        throw new Error(`Food item not found: ${reqItem.foodItemId}`);

      const quantity = reqItem.quantity || 1;
      totalAmount += foodItem.price * quantity;

      return {
        foodItemId: foodItem._id,
        name: foodItem.name,
        price: foodItem.price,
        quantity,
      };
    });

    // COD orders: create directly, no Razorpay involved.
    if (paymentMethod !== "ONLINE") {
      const order = await Order.create({
        guestId: req.user._id,
        hotelId: req.user.hotelId,
        roomId: req.user.roomId,
        items: orderItems,
        totalAmount,
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        status: "NEW",
      });

      return res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: orderDTO(order),
      });
    }

    // ONLINE orders: create a Razorpay order first, save our Order in PENDING
    // payment state, and hand the frontend what it needs to open checkout.
    let razorpayOrder;
    try {
      razorpayOrder = await getRazorpay().orders.create({
        amount: Math.round(totalAmount * 100), // paise
        currency: "INR",
        receipt: `order_rcpt_${Date.now()}`,
      });
    } catch (error) {
      if (error.code === "RAZORPAY_NOT_CONFIGURED") {
        return res.status(503).json({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }

    const order = await Order.create({
      guestId: req.user._id,
      hotelId: req.user.hotelId,
      roomId: req.user.roomId,
      items: orderItems,
      totalAmount,
      paymentMethod: "ONLINE",
      paymentStatus: "PENDING",
      status: "NEW",
      razorpayOrderId: razorpayOrder.id,
    });

    return res.status(201).json({
      success: true,
      message: "Razorpay order created — complete payment to confirm",
      data: {
        ...orderDTO(order),
        razorpay: {
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          keyId: process.env.RAZORPAY_KEY_ID,
        },
      },
    });
  } catch (error) {
    logger.error(error, "Create order error");
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create order",
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !orderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification fields",
      });
    }

    const order = await Order.findOne({ _id: orderId, guestId: req.user._id });
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      order.paymentStatus = "FAILED";
      await order.save();
      return res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }

    order.paymentStatus = "PAID";
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: orderDTO(order),
    });
  } catch (error) {
    logger.error(error, "Verify payment error");
    return res
      .status(500)
      .json({ success: false, message: "Payment verification failed" });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ guestId: req.user._id }).sort({
      createdAt: -1,
    });
    return res.status(200).json({ success: true, data: orders.map(orderDTO) });
  } catch (error) {
    logger.error(error, "Get my orders error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch orders" });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      guestId: req.user._id,
    });
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    return res.status(200).json({ success: true, data: orderDTO(order) });
  } catch (error) {
    logger.error(error, "Get order error");
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch order" });
  }
};

// =====================================================
// KITCHEN-FACING (public) ENDPOINTS
// =====================================================

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    const roomIds = [
      ...new Set(orders.map((o) => o.roomId && o.roomId.toString())),
    ].filter(Boolean);

    const rooms = roomIds.length
      ? await Room.find({ _id: { $in: roomIds } }).select("roomNumber")
      : [];

    const roomMap = new Map(rooms.map((r) => [r._id.toString(), r]));

    const data = orders.map((order) =>
      kitchenOrderDTO(order, roomMap.get(order.roomId?.toString())),
    );

    return res.status(200).json(data);
  } catch (error) {
    logger.error(error, "Get all orders error");
    return res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "status is required" });
    }

    const normalized = normalizeStatus(status);

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: normalized },
      { new: true },
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    let room = null;
    if (order.roomId) {
      room = await Room.findById(order.roomId).select("roomNumber");
    }

    return res.status(200).json(kitchenOrderDTO(order, room));
  } catch (error) {
    logger.error(error, "Update order status error");
    return res.status(500).json({
      message: "Failed to update order status",
      error: error.message,
    });
  }
};
