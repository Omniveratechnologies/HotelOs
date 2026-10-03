import { api } from "../apiFetch.js";
export {
  getLiveRates,
  updateLiveRates,
  updateRateRestrictions,
} from "./hotels.js";

/**
 * Fetches all rate plans configured for current hotel.
 * @returns {Promise<Array<object>>}
 */
export const getRatePlans = async () => {
  const result = await api.get("/api/v1/rate-plans", { auth: true });
  return result.data || [];
};

/**
 * Creates a new rate plan.
 * @param {object} data
 * @returns {Promise<object>}
 */
export const createRatePlan = async (data) => {
  const result = await api.post("/api/v1/rate-plans", data, { auth: true });
  return result.data;
};

/**
 * Updates an existing rate plan.
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>}
 */
export const updateRatePlan = async (id, data) => {
  const result = await api.patch(`/api/v1/rate-plans/${id}`, data, {
    auth: true,
  });
  return result.data;
};

/**
 * Deletes a rate plan.
 * @param {string} id
 * @returns {Promise<object>}
 */
export const deleteRatePlan = async (id) => {
  const result = await api.delete(`/api/v1/rate-plans/${id}`, { auth: true });
  return result.data || result;
};

/**
 * Synchronizes rate plans with channel manager across a date range.
 * @param {object} [dateRange={}]
 * @returns {Promise<object>}
 */
export const syncRatePlans = async (dateRange = {}) => {
  const result = await api.post("/api/v1/rate-plans/sync", dateRange, {
    auth: true,
  });
  return result.data;
};
