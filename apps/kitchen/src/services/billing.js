import { apiFetch } from "@hotelos/api";
import API_BASE_URL from "../config/api.js";

const base = `${API_BASE_URL}/v1/billing`;
const pmsBase = `${API_BASE_URL}/v1/integrations/pms`;
const unwrap = async (request) => (await request).data;
const request = (path, options = {}) =>
  unwrap(apiFetch(`${base}${path}`, { auth: true, ...options }));
const pmsRequest = (path, options = {}) =>
  unwrap(apiFetch(`${pmsBase}${path}`, { auth: true, ...options }));
const resource = (name) => ({
  list: () => request(`/${name}`),
  create: (body) => request(`/${name}`, { method: "POST", body }),
  update: (id, body) => request(`/${name}/${id}`, { method: "PATCH", body }),
  remove: (id) =>
    apiFetch(`${base}/${name}/${id}`, { method: "DELETE", auth: true }),
});
export const getRooms = () => request("/rooms");
export const createBill = (body) => request("/bills", { method: "POST", body });
export const saveBill = (id, body = {}) =>
  request(`/bills/${id}/save`, { method: "PATCH", body });
export const getBills = (query = "") =>
  request(`/bills${query ? `?${query}` : ""}`);
export const getBill = (id) => request(`/bills/${id}`);
export const cancelBill = (id) =>
  request(`/bills/${id}/cancel`, { method: "PATCH" });
export const getRoomCharges = () => request("/room-charges");
export const createRoomCharge = (body) =>
  request("/room-charges", { method: "POST", body });
export const settleRoomCharge = (id) =>
  request(`/room-charges/${id}/settle`, { method: "PATCH" });
export const createPayment = (body) =>
  request("/payments", { method: "POST", body });
export const getPayments = () => request("/payments");
export const createRefund = (body) =>
  request("/refunds", { method: "POST", body });
export const getRefunds = () => request("/refunds");
export const decideRefund = (id, decision) =>
  request(`/refunds/${id}/decision`, { method: "PATCH", body: { decision } });
export const getKots = () => request("/kots");
export const updateKotStatus = (id, status) =>
  request(`/kots/${id}/status`, { method: "PATCH", body: { status } });
const charges = resource("charges");
export const getCharges = charges.list;
export const createCharge = charges.create;
export const updateCharge = charges.update;
export const deleteCharge = charges.remove;
const coupons = resource("coupons");
export const getCoupons = coupons.list;
export const createCoupon = coupons.create;
export const updateCoupon = coupons.update;
export const deleteCoupon = coupons.remove;
export const getBillingSettings = () => request("/settings");
export const updateBillingSettings = (body) =>
  request("/settings", { method: "PATCH", body });
export const lookupCurrentGuest = (roomNumber) =>
  pmsRequest(`/rooms/${encodeURIComponent(roomNumber)}/current-guest`);
export const postChargeToRoom = (body) =>
  pmsRequest("/folio-charges", { method: "POST", body });
export const reverseRoomCharge = (transactionId) =>
  pmsRequest(`/folio-charges/${transactionId}/reverse`, { method: "POST" });
