import { apiFetch } from "../apiFetch.js";

/**
 * Fetches comprehensive hotel report data.
 * @param {object} params - Query parameters
 * @param {string} params.period - 'today', 'week', 'month', 'custom'
 * @param {string} params.startDate - YYYY-MM-DD (for custom period)
 * @param {string} params.endDate - YYYY-MM-DD (for custom period)
 * @returns {Promise<object>}
 */
export const getReportData = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.period) searchParams.set("period", params.period);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);

  const queryString = searchParams.toString();
  const url = `/api/v1/reports/dashboard${queryString ? `?${queryString}` : ""}`;
  const result = await apiFetch(url, { auth: true });
  return result.data;
};
