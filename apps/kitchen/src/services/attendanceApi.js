import API_BASE_URL from "../config/api.js";

const ATTENDANCE_API = `${API_BASE_URL}/v1/attendance`;

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined)
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
  const response = await fetch(`${ATTENDANCE_API}${path}`, options);
  if (!response.ok) throw await readError(response);
  return response.json();
};

// GET /attendance?from=&to=&department_id=&designation_id=&status=&q=&sort=&direction=&page=&limit=
export const fetchAttendance = (params, signal) =>
  request(`?${buildQuery(params)}`, { signal });

// GET /attendance/stats
export const fetchAttendanceStats = async (params, signal) =>
  (await request(`/stats?${buildQuery(params)}`, { signal })).data;

// GET /attendance/trend?days=30
export const fetchAttendanceTrend = async (params, signal) =>
  (await request(`/trend?${buildQuery(params)}`, { signal })).data;

// GET /attendance/activity?limit=5
export const fetchAttendanceActivity = async (limit = 5, signal) =>
  (await request(`/activity?limit=${limit}`, { signal })).data;

// GET /attendance/:id
export const fetchAttendanceDetail = async (id) =>
  (await request(`/${id}`)).data;

// PATCH /attendance/:id
export const correctAttendance = (id, values) =>
  request(`/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });

// GET /attendance/export?...same filters
export const downloadAttendanceCsv = async (params) => {
  const response = await fetch(
    `${ATTENDANCE_API}/export?${buildQuery(params)}`,
  );
  if (!response.ok) throw await readError(response);

  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = "attendance-history.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
