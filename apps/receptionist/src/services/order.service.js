import { api } from "@hotelos/api";

export const getStaffOrders = async () => {
  const result = await api.get("/api/v1/orders/staff", { auth: true });

  return result.data || [];
};

// COD-only desk order for a guest's active stay in the given room.
export const createDeskOrder = async ({ roomId, items }) => {
  const result = await api.post(
    "/api/v1/orders/desk",
    { roomId, items },
    { auth: true },
  );

  return result.data;
};

export const updateOrderStatusApi = async (orderId, status) => {
  const result = await api.patch(
    `/api/v1/orders/${orderId}/status`,
    { status },
    { auth: true },
  );

  return result.data;
};

export const getFoodItems = async () => {
  const result = await api.get("/api/v1/food-items", { auth: true });

  return result.data || [];
};
