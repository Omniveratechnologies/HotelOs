import type {
  CreateOrderInput,
  FoodItem,
  Order,
  PaymentVerificationInput,
  ServiceRequestInput,
  TableDetails,
} from "../types";

const raw = (import.meta.env.VITE_API_URL ?? "http://localhost:5001")
  .trim()
  .replace(/\/+$/, "");
const API_BASE_URL = raw.endsWith("/api/v1") ? raw : `${raw}/api/v1`;

let activeSessionToken: string | null = null;
let activeCsrfToken: string | null = null;
let currentCoordinates: {
  latitude: number;
  longitude: number;
  accuracy?: number;
} | null = null;

export function setApiSessionCredentials(
  token: string | null,
  csrf: string | null = null,
) {
  activeSessionToken = token;
  activeCsrfToken = csrf;
}

export function setApiClientCoordinates(
  coords: { latitude: number; longitude: number; accuracy?: number } | null,
) {
  currentCoordinates = coords;
}

export class ApiError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (activeSessionToken) {
    headers["x-session-token"] = activeSessionToken;
  }

  if (activeCsrfToken) {
    headers["x-csrf-token"] = activeCsrfToken;
  }

  if (currentCoordinates) {
    headers["x-location-latitude"] = String(currentCoordinates.latitude);
    headers["x-location-longitude"] = String(currentCoordinates.longitude);
    if (typeof currentCoordinates.accuracy === "number") {
      headers["x-location-accuracy"] = String(currentCoordinates.accuracy);
    }
  }

  const res = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new ApiError(
      json.message || `Request failed with status ${res.status}`,
      json.code,
      res.status,
    );
  }
  return (json.data ?? json) as T;
}

export interface SessionData {
  token: string;
  csrfToken?: string;
  sessionType: "QR_GUEST" | "KIOSK";
  hotelId: string;
  tableId?: string;
  tableNumber?: string;
  kioskId?: string;
  deviceId?: string;
  expiresAt: string;
}

export const api = {
  // Session Authentication APIs
  createQrGuestSession: (payload: {
    hotelId: string;
    tableId: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
  }) =>
    request<SessionData>("/sessions/qr-guest", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  exchangeKioskHandoff: (handoffCode: string) =>
    request<SessionData>("/sessions/kiosk-exchange", {
      method: "POST",
      body: JSON.stringify({ handoffCode }),
    }),

  validateSession: () =>
    request<{
      valid: boolean;
      sessionType: "QR_GUEST" | "KIOSK";
      hotelId: string;
      tableId?: string;
      kioskId?: string;
      expiresAt: string;
      tableNumber?: string;
    }>("/sessions/validate"),

  revokeSession: () =>
    request<{ success: boolean; message: string }>("/sessions/revoke", {
      method: "POST",
    }),

  // Table Details
  getTable: (hotelId: string, tableId: string) =>
    request<TableDetails>(`/tables/public/${hotelId}/${tableId}`),

  // Menu and Upselling
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

  // Orders
  createOrder: (input: CreateOrderInput, idempotencyKey?: string) =>
    request<Order>("/orders/table-order", {
      method: "POST",
      headers: idempotencyKey ? { "x-idempotency-key": idempotencyKey } : {},
      body: JSON.stringify(input),
    }),

  getOrder: (orderId: string) =>
    request<Order>(`/orders/table-order/${orderId}`),

  getSessionOrders: () => request<Order[]>("/orders/table-order"),

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

  // Service Requests (Assistance & Feedback)
  createServiceRequest: (input: ServiceRequestInput) =>
    request("/service-requests/table-order", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  // Discounts & Coupons
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
