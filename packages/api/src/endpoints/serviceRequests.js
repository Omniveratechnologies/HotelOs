import { api } from "../apiFetch.js";

/**
 * Fetches housekeeping and service requests for hotel staff.
 * @returns {Promise<Array<object>>}
 */
export const getStaffRequests = async () => {
  const result = await api.get("/api/v1/service-requests/staff", {
    auth: true,
  });
  return result.data || [];
};

/**
 * Creates a service or housekeeping request from the front desk.
 * @param {object} payload
 * @param {string} payload.roomId
 * @param {string} payload.type
 * @param {string} [payload.description]
 * @param {Array<object>} [payload.items]
 * @param {string} [payload.priority]
 * @returns {Promise<object>}
 */
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

/**
 * Updates status of an existing service request.
 * @param {string} requestId
 * @param {string} status
 * @returns {Promise<object>}
 */
export const updateRequestStatusApi = async (requestId, status) => {
  const result = await api.patch(
    `/api/v1/service-requests/${requestId}/status`,
    { status },
    { auth: true },
  );
  return result.data;
};
