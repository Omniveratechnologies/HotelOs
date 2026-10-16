export const tableDTO = (t) => ({
  id: t._id,
  tableNumber: t.tableNumber,
  seats: t.seats,
  section: t.section,
  status: t.status,
  qrUrl: `${process.env.TABLE_ORDER_FRONTEND_URL}/${t.hotelId}/table/${t._id}`,
});
