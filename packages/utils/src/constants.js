export const ORDER_STATUS_MAP = {
  NEW: "new",
  PREPARING: "preparing",
  READY: "ready",
  OUT_FOR_DELIVERY: "out-for-delivery",
  DELIVERED: "delivered",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
};

export const UI_TO_ORDER_STATUS = {
  new: "NEW",
  preparing: "PREPARING",
  ready: "READY",
  "out-for-delivery": "OUT_FOR_DELIVERY",
  delivered: "DELIVERED",
  rejected: "REJECTED",
  cancelled: "CANCELLED",
};

export const REQUEST_STATUS_MAP = {
  REQUESTED: "requested",
  ACKNOWLEDGED: "acknowledged",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const REQUEST_TYPE_MAP = {
  AMENITY: "Amenity request",
  HOUSEKEEPING: "Housekeeping",
  RESTAURANT: "Dining / Room Service",
  RECEPTION: "Front Desk",
  MAINTENANCE: "Maintenance",
  LAUNDRY: "Laundry",
  MEDICINE: "Medicine / First Aid",
  TRANSPORT: "Transport / Cab",
  SPA: "Spa & Wellness",
  EMERGENCY: "Emergency",
  CONCIERGE: "Concierge",
  WAKEUP_CALL: "Wake-up Call",
  ROOM_CONTROL: "Room Controls",
  FEEDBACK: "Feedback / Inquiry",
};
