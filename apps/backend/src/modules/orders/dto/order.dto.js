export const orderDTO = (order) => ({
  id: order._id,
  items: order.items,
  totalAmount: order.totalAmount,
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  status: order.status,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});
// Staff-facing shape: enriches an order with the guest's room number and the
// guest display name so front-desk dashboards don't need extra lookups.
export const staffOrderDTO = (order, room, guest) => ({
  id: order._id,

  guestId: order.guestId,
  roomId: order.roomId,

  roomNumber: room ? room.roomNumber : "",
  guestName: guest?.name || "",

  items: order.items,

  totalAmount: order.totalAmount,
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  status: order.status,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});
