import API_BASE_URL from "../config/api.js";

const DESIGNATIONS_API = `${API_BASE_URL}/v1/staffManagement/designations`;

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined)
      query.set(key, value);
  });
  return query.toString();
};

const request = async (path = "", options = {}) => {
  const response = await fetch(`${DESIGNATIONS_API}${path}`, options);
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

export const fetchDesignations = (params, signal) =>
  request(`?${buildQuery(params)}`, { signal });

export const fetchDesignationStats = async () => (await request("/stats")).data;

export const createDesignation = (values) =>
  request("", jsonOptions("POST", values));

export const updateDesignation = (id, values) =>
  request(`/${id}`, jsonOptions("PUT", values));

export const deleteDesignation = (id) =>
  request(`/${id}`, { method: "DELETE" });
