import { api } from "../apiFetch.js";

/**
 * Creates and sends a digital self-check-in link via email to the guest.
 * @param {{ reservationId: string, email?: string, message?: string }} payload
 * @returns {Promise<Object>}
 */
export const sendCheckInLink = async ({ reservationId, email, message }) => {
  const result = await api.post(
    "/api/v1/check-in/links",
    { reservationId, email, message },
    {
      auth: true,
    },
  );
  return result.data;
};

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

// =====================================================
// PUBLIC SELF-CHECKIN & KIOSK ENDPOINTS
// =====================================================

/**
 * Public kiosk endpoint to search a booking by reference or email and request OTP.
 * @param {string} identifier
 * @returns {Promise<{ reservationId: string, maskedEmail: string }>}
 */
export const lookupCheckInBooking = async (identifier) => {
  const result = await api.post("/api/v1/public/check-in/lookup", {
    identifier,
  });
  return result.data;
};

/**
 * Public kiosk endpoint to verify 6-digit email OTP.
 * @param {string} reservationId
 * @param {string} code
 * @returns {Promise<{ token: string, session: Object }>}
 */
export const verifyCheckInOtp = async (reservationId, code) => {
  const result = await api.post("/api/v1/public/check-in/verify-otp", {
    reservationId,
    code,
  });
  return result.data;
};

/**
 * Resolves a public check-in session by token.
 * @param {string} token
 * @returns {Promise<Object>}
 */
export const resolvePublicCheckIn = async (token) => {
  const result = await api.get(`/api/v1/public/check-in/${token}`);
  return result.data;
};

/**
 * Saves a single step in the public self check-in wizard.
 * @param {string} token
 * @param {string} step
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export const savePublicCheckInStep = async (token, step, payload) => {
  const result = await api.put(
    `/api/v1/public/check-in/${token}/steps/${step}`,
    payload,
  );
  return result.data;
};

/**
 * Submits the completed self check-in wizard.
 * @param {string} token
 * @param {Object} [payload={}]
 * @returns {Promise<Object>}
 */
export const submitPublicCheckIn = async (token, payload = {}) => {
  const result = await api.post(
    `/api/v1/public/check-in/${token}/submit`,
    payload,
  );
  return result.data;
};
