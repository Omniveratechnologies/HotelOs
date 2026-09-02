import crypto from "crypto";
import Order from "../models/Order.js";
import FoodItem from "../models/FoodItem.js";
import razorpay from "../config/razorpay.js";
import { orderDTO } from "../dto/order.dto.js";

export const createOrder = async (req, res) => {
  try {
    const { items, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "items are required" });
    }

    const foodItems = await FoodItem.find({ _id: { $in: items.map((i) => i.foodItemId) } });

    let totalAmount = 0;
    const orderItems = items.map((reqItem) => {
      const foodItem = foodItems.find((f) => f._id.toString() === reqItem.foodItemId);
      if (!foodItem) throw new Error(`Food item not found: ${reqItem.foodItemId}`);

      const quantity = reqItem.quantity || 1;
      totalAmount += foodItem.price * quantity;

      return { foodItemId: foodItem._id, name: foodItem.name, price: foodItem.price, quantity };
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
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // paise
      currency: "INR",
      receipt: `order_rcpt_${Date.now()}`,
    });

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
    console.error("Create order error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create order" });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment verification fields" });
    }

    const order = await Order.findOne({ _id: orderId, guestId: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      order.paymentStatus = "FAILED";
      await order.save();
      return res.status(400).json({ success: false, message: "Payment verification failed" });
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
    console.error("Verify payment error:", error);
    return res.status(500).json({ success: false, message: "Payment verification failed" });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ guestId: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: orders.map(orderDTO) });
  } catch (error) {
    console.error("Get my orders error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, guestId: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    return res.status(200).json({ success: true, data: orderDTO(order) });
  } catch (error) {
    console.error("Get order error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch order" });
  }
};