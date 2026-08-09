/**
 * Shared domain types for the hotel service platform.
 * The Kitchen, Reception and Housekeeping dashboards are expected to reuse
 * these exact shapes, so keep them free of UI concerns.
 */

export type ServiceKind = "food" | "amenities" | "restaurant" | "reception" | "housekeeping";

/** A stage name inside a service's status flow (see constants/service-flows). */
export type Status = string;

export type PaymentMethod = "cod" | "online";

export interface RequestItem {
  name: string;
  qty: number;
  price?: number | undefined;
}

export interface MenuItem {
  name: string;
  price: number;
  note: string;
}

export interface MenuCategory {
  category: string;
  items: MenuItem[];
}

export interface AmenityItem {
  name: string;
  note: string;
}

export interface GuestInfo {
  name: string;
  tier: string;
}

export interface Room {
  roomNumber: string;
  guestName: string;
  tier: string;
  checkIn: string;
  checkOut: string;
}

/** Any guest-initiated service request tracked on the dashboard. */
export interface ServiceRequest {
  id: string;
  kind: ServiceKind;
  items: RequestItem[];
  status: Status;
  /** Set when the last server sync for this request failed. */
  failed?: string | undefined;
  total?: number | undefined;
  payment?: PaymentMethod | undefined;
  createdAt: number;
  updatedAt: number;
}

/** A food request always carries a total and a payment method. */
export type Order = ServiceRequest & {
  kind: "food";
  total: number;
  payment: PaymentMethod;
};
