import { api } from "../apiFetch.js";

/**
 * Fetches food and restaurant orders for hotel staff.
 * @returns {Promise<Array<object>>}
 */
export const getStaffOrders = async () => {
  const result = await api.get("/api/v1/orders/staff", { auth: true });
  return result.data || [];
};

/**
 * Creates a food order placed from the front desk.
 * @param {object} payload
 * @param {string} payload.roomId
 * @param {Array<object>} payload.items
 * @returns {Promise<object>}
 */
export const createDeskOrder = async ({ roomId, items }) => {
  const result = await api.post(
    "/api/v1/orders/desk",
    { roomId, items },
    { auth: true },
  );
  return result.data;
};

/**
 * Updates status of an existing food order.
 * @param {string} orderId
 * @param {string} status
 * @returns {Promise<object>}
 */
export const updateOrderStatusApi = async (orderId, status) => {
  const result = await api.patch(
    `/api/v1/orders/${orderId}/status`,
    { status },
    { auth: true },
  );
  return result.data;
};

/**
 * Fetches available food menu items for room service.
 * @returns {Promise<Array<object>>}
 */
export const getFoodItems = async () => {
  const result = await api.get("/api/v1/food-items", { auth: true });
  return result.data || [];
};
