import API_BASE_URL from "../config/api.js";

const DEVICES_API = `${API_BASE_URL}/v1/attendance/devices`;

export const SOCKET_ORIGIN = new URL(API_BASE_URL, window.location.origin)
  .origin;

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== "" &&
      value !== null &&
      value !== undefined &&
      value !== "ALL"
    )
      query.set(key, value);
  });
  return query.toString();
};

const readError = async (response) => {
  let message = `Request failed (${response.status})`;
  try {
    const body = await response.json();
    if (body?.message) message = body.message;
  } catch {}
  return new Error(message);
};

const request = async (path = "", options = {}) => {
  const response = await fetch(`${DEVICES_API}${path}`, options);
  if (!response.ok) throw await readError(response);
  return response.json();
};

const json = (method, body) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: body === undefined ? undefined : JSON.stringify(body),
});

// GET /devices/summary?search=&status=&type=&sort=&direction=&page=&limit=
export const fetchDeviceSummary = (params, signal) =>
  request(`/summary?${buildQuery(params)}`, { signal });

// GET /devices?..
export const fetchDevices = (params, signal) =>
  request(`?${buildQuery(params)}`, { signal });

// GET /devices/:id
export const fetchDevice = async (id) => (await request(`/${id}`)).data;

// POST /devices
export const createDevice = async (values) =>
  (await request("", json("POST", values))).data;

// PUT /devices/:id
export const updateDevice = async (id, values) =>
  (await request(`/${id}`, json("PUT", values))).data;

export const deleteDevice = (id) => request(`/${id}`, { method: "DELETE" });

// POST /devices/:id/token
export const regenerateDeviceToken = async (id) =>
  (await request(`/${id}/token`, { method: "POST" })).data;

// POST /devices/:id/commands
export const sendDeviceCommand = async (id, type) =>
  (await request(`/${id}/commands`, json("POST", { type }))).data;

// POST /devices/sync-all
export const syncAllDevices = async () =>
  (await request("/sync-all", { method: "POST" })).data;
