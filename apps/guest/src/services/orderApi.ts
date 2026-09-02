import { apiRequest } from "./apiClient";
import type { Order, RazorpayOrderResponse } from "@/types/guest-dashboard";

export async function placeOrder(
  items: { foodItemId: string; quantity: number }[],
  paymentMethod: "COD" | "ONLINE",
): Promise<RazorpayOrderResponse> {
  return apiRequest<RazorpayOrderResponse>("/orders", {
    method: "POST",
    body: JSON.stringify({ items, paymentMethod }),
  });
}

export async function verifyPayment(payload: {
  orderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<Order> {
  return apiRequest<Order>("/orders/verify-payment", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchMyOrders(): Promise<Order[]> {
  return apiRequest<Order[]>("/orders");
}
