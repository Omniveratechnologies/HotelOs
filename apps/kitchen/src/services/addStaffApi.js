import API_BASE_URL from "../config/api";

const base = API_BASE_URL.replace(/\/+$/, "");

const STAFF_URL = base.endsWith("/api/v1")
  ? `${base}/staffManagement`
  : base.endsWith("/api")
    ? `${base}/v1/staffManagement`
    : `${base}/api/v1/staffManagement`;

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
    credentials: "include",
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Request failed.");
  }

  return result;
}

export const addStaffApi = {
  getById: (staffId) => request(`${STAFF_URL}/${staffId}`),

  update: (staffId, payload) =>
    request(`${STAFF_URL}/${staffId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  departments: () => request(`${STAFF_URL}/departments`),

  designations: (departmentId) => {
    if (!departmentId) {
      return Promise.resolve({ success: true, data: [] });
    }

    return request(
      `${STAFF_URL}/designations?departmentId=${encodeURIComponent(departmentId)}`,
    );
  },

  shifts: () => request(`${STAFF_URL}/shifts`),

  nextCode: () => request(`${STAFF_URL}/next-code`),

  staffList: (search = "") =>
    request(`${STAFF_URL}?limit=100&search=${encodeURIComponent(search)}`),

  create: (payload) =>
    request(STAFF_URL, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  uploadPhoto: (staffId, file) => {
    const formData = new FormData();
    formData.append("photo", file);

    return request(`${STAFF_URL}/${staffId}/photo`, {
      method: "POST",
      body: formData,
    });
  },

  registerFace: (staffId, embeddingRef) =>
    request(`${STAFF_URL}/${staffId}/face`, {
      method: "POST",
      body: JSON.stringify({ embeddingRef }),
    }),
};
