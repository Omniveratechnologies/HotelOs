export const billDTO = (b) => ({
  id: b._id,
  billNo: b.billNo,
  billType: b.billType,
  tableId: b.tableId,
  roomId: b.roomId,
  bookingId: b.bookingId,
  guestName: b.guestName,
  guestPhone: b.guestPhone,
  guestEmail: b.guestEmail,
  linkedOrderIds: b.linkedOrderIds,
  items: b.items,
  subtotal: b.subtotal,
  discountId: b.discountId,
  couponCode: b.couponCode,
  discountAmount: b.discountAmount,
  cgst: b.cgst,
  sgst: b.sgst,
  serviceCharges: b.serviceCharges,
  totalAmount: b.totalAmount,
  status: b.status,
  paymentStatus: b.paymentStatus,
  cashierId: b.cashierId,
  createdAt: b.createdAt,
  updatedAt: b.updatedAt,
});

export const paymentDTO = (p) => ({
  id: p._id,
  transactionId: p.transactionId,
  billId: p.billId,
  billNo: p.billNo,
  method: p.method,
  amount: p.amount,
  referenceNo: p.referenceNo,
  status: p.status,
  splitPayments: p.splitPayments,
  staffId: p.staffId,
  device: p.device,
  location: p.location,
  notes: p.notes,
  createdAt: p.createdAt,
});

export const refundDTO = (r) => ({
  id: r._id,
  refundId: r.refundId,
  billId: r.billId,
  billNo: r.billNo,
  paymentId: r.paymentId,
  amount: r.amount,
  reason: r.reason,
  paymentMethod: r.paymentMethod,
  status: r.status,
  requestedById: r.requestedById,
  approvedById: r.approvedById,
  notes: r.notes,
  createdAt: r.createdAt,
});

export const kotDTO = (k, table, room) => ({
  id: k._id,
  kotNo: k.kotNo,
  billId: k.billId,
  orderId: k.orderId,
  orderNo: k.orderId ? String(k.orderId).slice(-6).toUpperCase() : null,
  tableId: k.tableId,
  roomId: k.roomId,
  locationLabel: table
    ? `Table ${table.tableNumber}`
    : room
      ? `Room ${room.roomNumber}`
      : "—",
  station: k.station,
  items: k.items,
  status: k.status,
  timeline: k.timeline,
  createdAt: k.createdAt,
});

export const chargeDTO = (c) => ({
  id: c._id,
  name: c.name,
  type: c.type,
  value: c.value,
  applicableTo: c.applicableTo,
  status: c.status,
});

export const couponDTO = (c) => ({
  id: c._id,
  code: c.code,
  discountType: c.discountType,
  value: c.value,
  minOrder: c.minOrder,
  usageLimit: c.usageLimit,
  usedCount: c.usedCount,
  validFrom: c.validFrom,
  validTill: c.validTill,
  status: c.status,
});

export const billingSettingsDTO = (s) => ({
  general: s.general,
  invoice: s.invoice,
  paymentSettings: s.paymentSettings,
  taxSettings: s.taxSettings,
  receiptSettings: s.receiptSettings,
  cancellation: s.cancellation,
  discountPermissions: s.discountPermissions,
  rounding: s.rounding,
  invoiceDelivery: s.invoiceDelivery,
});
