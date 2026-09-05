import { api } from "@hotelos/api";

export const getStaffRequests = async () => {
  const result = await api.get("/api/v1/service-requests/staff", {
    auth: true,
  });

  return result.data || [];
};

export const createDeskRequest = async ({
  roomId,
  type,
  description,
  items,
  priority,
}) => {
  const result = await api.post(
    "/api/v1/service-requests/desk",
    { roomId, type, description, items, priority },
    { auth: true },
  );

  return result.data;
};

export const updateRequestStatusApi = async (requestId, status) => {
  const result = await api.patch(
    `/api/v1/service-requests/${requestId}/status`,
    { status },
    { auth: true },
  );

  return result.data;
};
