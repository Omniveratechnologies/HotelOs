import { api } from "../apiFetch.js";

/**
 * Fetches transactions list matching query parameters.
 * @param {object} [params]
 * @returns {Promise<Array<object>>}
 */
export async function fetchTransactions(params) {
  try {
    const result = await api.get("/api/v1/transactions", {
      auth: true,
      params,
    });
    return result.data || [];
  } catch {
    return [];
  }
}

/**
 * Fetches transaction summary statistics.
 * @param {object} [params]
 * @returns {Promise<Array<object>>}
 */
export async function fetchTransactionSummary(params) {
  try {
    const result = await api.get("/api/v1/transactions/summary", {
      auth: true,
      params,
    });
    return result.data || [];
  } catch {
    return [];
  }
}
