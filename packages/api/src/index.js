import { apiFetch, ApiError } from "./apiFetch.js";

const api = {
  get: (url, options) => apiFetch(url, { ...options, method: "GET" }),

  post: (url, body, options) =>
    apiFetch(url, {
      ...options,
      method: "POST",
      body,
    }),

  put: (url, body, options) =>
    apiFetch(url, {
      ...options,
      method: "PUT",
      body,
    }),

  patch: (url, body, options) =>
    apiFetch(url, {
      ...options,
      method: "PATCH",
      body,
    }),

  delete: (url, options) =>
    apiFetch(url, {
      ...options,
      method: "DELETE",
    }),
};

export { api, apiFetch, ApiError };
