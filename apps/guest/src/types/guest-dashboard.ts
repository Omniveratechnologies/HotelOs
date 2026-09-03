/**
 * Shared domain types for the hotel service platform.
 */

export type ServiceKind =
  "food" | "amenities" | "restaurant" | "reception" | "housekeeping";

export type Status = string;

export type PaymentMethod = "cod" | "online";

export interface AmenityItem {
  name: string;
  note: string;
}

export type GuestStatus = "ACTIVE" | "CHECKED_OUT";

export interface RoomInfo {
  id: string;
  roomNumber: string;
  type: string;
  status: string;
}

export interface GuestInfo {
  id: string;
  name: string;
  username: string;
  role: string;
  hotelId: string;
  checkIn: string | null;
  checkOut: string | null;
  dndEnabled: boolean;
  room: RoomInfo | null;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  isAvailable: boolean;
}

export interface OrderItem {
  foodItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: "COD" | "ONLINE";
  status:
    | "NEW"
    | "PREPARING"
    | "READY"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "REJECTED"
    | "CANCELLED";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  createdAt: string;
  updatedAt: string;
}

export interface RazorpayData {
  keyId: string;
  amount: number;
  currency: string;
  orderId: string;
}

export interface RazorpayOrderResponse {
  id: string;
  razorpay?: RazorpayData | undefined;
}

export type ServiceRequestType =
  "AMENITY" | "HOUSEKEEPING" | "RESTAURANT" | "RECEPTION" | "MAINTENANCE";

export interface ServiceRequest {
  id: string;
  type: ServiceRequestType;
  description?: string;
  items: string[];
  status:
    "REQUESTED" | "ACKNOWLEDGED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
}
