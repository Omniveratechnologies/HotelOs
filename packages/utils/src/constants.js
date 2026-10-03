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
  HOUSEKEEPING: "Housekeeping request",
  RESTAURANT: "Call restaurant",
  RECEPTION: "Reception request",
  MAINTENANCE: "Maintenance",
};
