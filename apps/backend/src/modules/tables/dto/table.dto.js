import env from "#/config/env.js";

export const tableDTO = (t) => ({
  id: t._id,
  tableNumber: t.tableNumber,
  seats: t.seats,
  section: t.section,
  status: t.status,
  qrUrl: `${env.frontendUrls.tableOrder}/${t.hotelId}/table/${t._id}`,
});
