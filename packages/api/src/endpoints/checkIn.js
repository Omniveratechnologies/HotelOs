import { api } from "../apiFetch.js";

/**
 * Fetches check-in sessions with filters.
 * @param {Object} filters - { dateRange?, source?, roomType?, status?, search?, page?, limit? }
 * @returns {Promise<{sessions: Array, stats: Object, pagination: Object}>}
 */
export const getCheckInSessions = async (filters = {}) => {
  const result = await api.get("/api/v1/check-in/sessions", {
    auth: true,
    params: filters,
  });
  return result.data;
};

/**
 * Fetches check-in statistics.
 * @returns {Promise<Object>}
 */
export const getCheckInStats = async () => {
  const result = await api.get("/api/v1/check-in/stats", {
    auth: true,
  });
  return result.data;
};

/**
 * Approves a check-in session.
 * @param {string} sessionId
 * @returns {Promise<Object>}
 */
export const approveCheckInSession = async (sessionId) => {
  const result = await api.post(
    `/api/v1/check-in/sessions/${sessionId}/approve`,
    {},
    {
      auth: true,
    },
  );
  return result.data;
};

/**
 * Rejects a check-in session.
 * @param {string} sessionId
 * @param {string} reason
 * @returns {Promise<Object>}
 */
export const rejectCheckInSession = async (sessionId, reason) => {
  const result = await api.post(
    `/api/v1/check-in/sessions/${sessionId}/reject`,
    { reason },
    {
      auth: true,
    },
  );
  return result.data;
};

/**
 * Requests correction for a check-in session.
 * @param {string} sessionId
 * @param {string} message
 * @returns {Promise<Object>}
 */
export const requestCheckInCorrection = async (sessionId, message) => {
  const result = await api.post(
    `/api/v1/check-in/sessions/${sessionId}/request-correction`,
    { message },
    {
      auth: true,
    },
  );
  return result.data;
};

/**
 * Resends check-in link for a session.
 * @param {string} sessionId
 * @returns {Promise<Object>}
 */
export const resendCheckInLink = async (sessionId) => {
  const result = await api.post(
    `/api/v1/check-in/sessions/${sessionId}/resend-link`,
    {},
    {
      auth: true,
    },
  );
  return result.data;
};

/**
 * Deletes a check-in session.
 * @param {string} sessionId
 * @returns {Promise<Object>}
 */
export const deleteCheckInSession = async (sessionId) => {
  const result = await api.delete(`/api/v1/check-in/sessions/${sessionId}`, {
    auth: true,
  });
  return result.data;
};
