import API_BASE_URL from "../config/api.js";

const STAFF_API = `${API_BASE_URL}/v1/staffManagement`;

const buildQuery = (params) => {
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
    if (body?.errors?.length) message = body.errors.join(", ");
    else if (body?.message) message = body.message;
  } catch {}
  return new Error(message);
};

const request = async (path, options = {}) => {
  const response = await fetch(`${STAFF_API}${path}`, options);
  if (!response.ok) throw await readError(response);
  return response.json();
};

const downloadFile = async (path, filename) => {
  const response = await fetch(`${STAFF_API}${path}`);
  if (!response.ok) throw await readError(response);

  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const FILTER_KEYS = [
  "search",
  "department_id",
  "designation_id",
  "status",
  "joined_from",
  "joined_to",
  "sort",
  "direction",
];

const pickFilters = (filters) =>
  Object.fromEntries(FILTER_KEYS.map((key) => [key, filters[key]]));

const jsonOptions = (method, body) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const fetchStaff = (filters, signal) =>
  request(
    `/?${buildQuery({ ...pickFilters(filters), page: filters.page, limit: filters.limit })}`,
    { signal },
  );

export const fetchStaffStats = async () => (await request("/stats")).data;

export const fetchStaffLookups = async () => {
  const [departments, designations] = await Promise.all([
    request("/departments"),
    request("/designations"),
  ]);
  return { departments: departments.data, designations: designations.data };
};

export const fetchStaffById = async (id) => (await request(`/${id}`)).data;
export const createStaff = async (body) =>
  (await request("/", jsonOptions("POST", body))).data;
export const updateStaff = async (id, body) =>
  (await request(`/${id}`, jsonOptions("PUT", body))).data;
export const deleteStaff = (id) => request(`/${id}`, { method: "DELETE" });
export const bulkStaffAction = async (ids, action) =>
  (await request("/bulk", jsonOptions("POST", { ids, action }))).data;

export const exportStaff = (filters, format = "csv") =>
  downloadFile(
    `/export?${buildQuery({ ...pickFilters(filters), format })}`,
    `staff-export.${format}`,
  );

export const importStaff = async (file) => {
  const body = new FormData();
  body.append("file", file);
  return (await request("/import", { method: "POST", body })).data;
};

export const getImportJob = async (jobId) =>
  (await request(`/import/${jobId}`)).data;
export const downloadImportErrors = (jobId) =>
  downloadFile(`/import/${jobId}/errors`, "staff-import-errors.csv");
export const downloadImportTemplate = () =>
  downloadFile("/import/template", "staff-import-template.csv");

export const uploadStaffPhoto = async (id, file) => {
  const body = new FormData();
  body.append("photo", file);
  return (await request(`/${id}/photo`, { method: "POST", body })).data
    .photoUrl;
};
export const removeStaffPhoto = (id) =>
  request(`/${id}/photo`, { method: "DELETE" });
