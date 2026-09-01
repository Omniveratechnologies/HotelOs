export type RoomStatus = "available" | "occupied" | "reserved" | "cleaning";

export type OrderStatus =
   "new" | "preparing" | "ready" | "out_for_delivery" | "delivered";

export type ServiceRequestStatus = "requested" | "acknowledged" | "completed";

export type ServiceRequestType = "amenity" | "housekeeping" | "restaurant";

export interface Room {
   id: string;
   number: string;
   floor: number;
   status: RoomStatus;
   guestName?: string;
   guestPhone?: string;
   guestCount?: number;
   nights?: number;
   idProof?: string;
   checkInTime?: string;
   ratePerNight?: number;
}

export interface ServiceRequest {
   id: string;
   roomNumber: string;
   type: ServiceRequestType;
   details: string;
   status: ServiceRequestStatus;
   timestamp: string;
}

export interface FoodOrder {
   id: string;
   roomNumber: string;
   items: string[];
   payment: "COD" | "Card" | "UPI";
   status: OrderStatus;
   timestamp: string;
}

export interface CheckInFormData {
   guestName: string;
   phone: string;
   guests: number;
   nights: number;
   idProof: string;
}

export interface DashboardStats {
   occupiedRooms: number;
   availableRooms: number;
   totalRooms: number;
   pendingRequests: number;
   activeFoodOrders: number;
}
