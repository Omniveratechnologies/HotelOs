import API_BASE_URL from "../config/api.js";

const DEPARTMENTS_API = `${API_BASE_URL}/v1/staffManagement/departments`;

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined)
      query.set(key, value);
  });
  return query.toString();
};

const request = async (path = "", options = {}) => {
  const response = await fetch(`${DEPARTMENTS_API}${path}`, options);
  let body = null;

  try {
    body = await response.json();
  } catch {}

  if (!response.ok || body?.success === false) {
    throw new Error(body?.message || `Request failed (${response.status})`);
  }

  return body;
};

const jsonOptions = (method, body) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// GET /departments?search=&status=ALL|ACTIVE|INACTIVE&page=&limit=
export const fetchDepartments = (params, signal) =>
  request(`?${buildQuery(params)}`, { signal });

// GET /departments/stats
export const fetchDepartmentStats = async () => (await request("/stats")).data;

export const createDepartment = (values) =>
  request("", jsonOptions("POST", values));

export const updateDepartment = (id, values) =>
  request(`/${id}`, jsonOptions("PUT", values));

export const deleteDepartment = (id) => request(`/${id}`, { method: "DELETE" });

export const fetchDepartmentSummary = async (key, signal) =>
  (await request(`/${encodeURIComponent(key)}/summary`, { signal })).data;

export const fetchDepartmentDesignations = async (key, signal) =>
  (await request(`/${encodeURIComponent(key)}/designations`, { signal })).data;
