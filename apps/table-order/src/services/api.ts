import type {
  CreateOrderInput,
  FoodItem,
  Order,
  PaymentVerificationInput,
  ServiceRequestInput,
  TableDetails,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5001/api/v1";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Something went wrong");
  }
  return (json.data ?? json) as T;
}

export const api = {
  getTable: (hotelId: string, tableId: string) =>
    request<TableDetails>(`/tables/public/${hotelId}/${tableId}`),

  getMenu: (hotelId: string) =>
    request<FoodItem[]>(`/food-items/public/${hotelId}`),

  getUpsellSuggestions: (hotelId: string, foodItemIds: string[]) =>
    request<any[]>(
      `/upselling/public/${hotelId}/suggest?foodItemIds=${foodItemIds.join(",")}`,
    ),
  trackUpsellEvent: (payload: {
    hotelId: string;
    ruleId?: string;
    eventType: string;
    revenue?: number;
  }) =>
    request("/upselling/public/track", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  createOrder: (input: CreateOrderInput) =>
    request<Order>("/orders/table-order", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  getOrder: (orderId: string) =>
    request<Order>(`/orders/table-order/${orderId}`),

  verifyPayment: (input: PaymentVerificationInput) =>
    request<Order>("/orders/verify-payment", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  verifyTableOrderPayment: (input: PaymentVerificationInput) =>
    request<Order>("/orders/table-order/verify-payment", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  markPaymentFailed: (input: { orderId: string }) =>
    request<{ success: boolean }>("/orders/table-order/payment-failed", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  createServiceRequest: (input: ServiceRequestInput) =>
    request("/service-requests/table-order", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  getDiscounts: (hotelId: string) =>
    request<{ id: string; name: string; type: string; value: number }[]>(
      `/menu/discounts/public/${hotelId}`,
    ),
  validateCoupon: (hotelId: string, code: string) =>
    request<{
      id: string;
      code: string;
      discountType: string;
      value: number;
      minOrder: number;
    }>(`/billing/coupons/public/${hotelId}/${code}`),
};
