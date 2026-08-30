import { API_URL } from "./config/env.js";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch(
  path,
  {
    method = "GET",
    body,
    auth = false,
    headers = {},
    query,
    timeout = 30000,
    signal,
  } = {},
) {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  const finalSignal = signal || controller.signal;

  const url = new URL(path, API_URL);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const requestHeaders = {
    Accept: "application/json",
    ...headers,
  };

  const isJsonBody =
    body !== undefined && body !== null && !(body instanceof FormData);

  if (isJsonBody) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = localStorage.getItem("auth_token");

    if (!token) {
      throw new ApiError("Authentication required.", 401);
    }

    requestHeaders.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
      signal: finalSignal,
    });
  } catch (error) {
    clearTimeout(timeoutId);

    if (signal?.aborted) {
      throw new ApiError("Request aborted.", 0);
    }

    if (error.name === "AbortError") {
      throw new ApiError("Request timed out.", 0);
    }

    throw new ApiError(
      "Unable to reach the server. Please check your connection.",
      0,
    );
  }

  clearTimeout(timeoutId);

  const contentType = response.headers.get("content-type") || "";

  let data = null;

  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      throw new ApiError("Invalid JSON response from server.", response.status);
    }
  } else {
    data = await response.text();
  }

  if (response.status === 401) {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    throw new ApiError(
      data?.message || "Session expired. Please login again.",
      401,
    );
  }

  if (!response.ok) {
    throw new ApiError(
      data?.message || data?.error || `Request failed (${response.status})`,
      response.status,
    );
  }

  return data;
}
