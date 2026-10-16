import { api } from "../apiFetch.js";

/**
 * Fetch arrivals queue for front desk.
 * @param {Object} params - { date, expressOnly, q }
 */
export const getArrivalsQueue = async (params = {}) => {
  const result = await api.get("/api/v1/bookings/front-desk/arrivals", {
    auth: true,
    params,
  });
  return result.data;
};

/**
 * Fetch departures queue for front desk.
 * @param {Object} params - { q }
 */
export const getDeparturesQueue = async (params = {}) => {
  const result = await api.get("/api/v1/bookings/front-desk/departures", {
    auth: true,
    params,
  });
  return result.data;
};

/**
 * Fetch front desk stats summary.
 */
export const getFrontDeskStats = async () => {
  const result = await api.get("/api/v1/bookings/front-desk/stats", {
    auth: true,
  });
  return result.data;
};

/**
 * Fetch booking folio details and charges breakdown.
 * @param {string} bookingId
 */
export const getBookingFolio = async (bookingId) => {
  const result = await api.get(`/api/v1/bookings/${bookingId}/folio`, {
    auth: true,
  });
  return result.data;
};

/**
 * Complete front desk check-in for a booking.
 * @param {string} bookingId
 * @param {Object} data - { roomId, keyCardNumber, depositAmount, paymentMode, notes }
 */
export const checkInBooking = async (bookingId, data = {}) => {
  const result = await api.post(
    `/api/v1/bookings/${bookingId}/check-in`,
    data,
    {
      auth: true,
    },
  );
  return result.data;
};

/**
 * Complete front desk check-out for a booking.
 * @param {string} bookingId
 * @param {Object} data - { settlementMode, notes }
 */
export const checkOutBooking = async (bookingId, data = {}) => {
  const result = await api.post(
    `/api/v1/bookings/${bookingId}/check-out`,
    data,
    {
      auth: true,
    },
  );
  return result.data;
};

/**
 * 1-click express check-in.
 * @param {string} bookingId
 * @param {Object} data
 */
export const expressCheckInBooking = async (bookingId, data = {}) => {
  const result = await api.post(
    `/api/v1/bookings/${bookingId}/express-check-in`,
    data,
    {
      auth: true,
    },
  );
  return result.data;
};
