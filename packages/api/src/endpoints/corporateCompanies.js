import { api } from "../apiFetch.js";

/**
 * Fetch corporate companies with optional query and status filters.
 * @param {Object} params - { q, status, page, limit }
 */
export const getCorporateCompanies = async (params = {}) => {
  const result = await api.get("/api/v1/corporate-companies", {
    auth: true,
    params,
  });
  return result.data;
};

/**
 * Fetch single corporate company by ID.
 * @param {string} id
 */
export const getCorporateCompany = async (id) => {
  const result = await api.get(`/api/v1/corporate-companies/${id}`, {
    auth: true,
  });
  return result.data;
};

/**
 * Create a new corporate company account.
 * @param {Object} data
 */
export const createCorporateCompany = async (data) => {
  const result = await api.post("/api/v1/corporate-companies", data, {
    auth: true,
  });
  return result.data;
};

/**
 * Update an existing corporate company account.
 * @param {string} id
 * @param {Object} data
 */
export const updateCorporateCompany = async (id, data) => {
  const result = await api.patch(`/api/v1/corporate-companies/${id}`, data, {
    auth: true,
  });
  return result.data;
};

/**
 * Delete a corporate company account.
 * @param {string} id
 */
export const deleteCorporateCompany = async (id) => {
  const result = await api.delete(`/api/v1/corporate-companies/${id}`, {
    auth: true,
  });
  return result.data;
};
