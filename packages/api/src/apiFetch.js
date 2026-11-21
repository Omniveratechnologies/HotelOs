import { API_URL } from "./config/env.js";

export { API_URL };

/**
 * Custom error thrown when an API request fails.
 */

export class ApiError extends Error {
  /**
   * @param {string} message - Error description
   * @param {number} status - HTTP status code
   * @param {object} [validationErrors] - Field-level validation errors { body, query, params }
   * @param {string} [errorCode] - Standardized error code from backend
   * @param {object} [errorDetails] - Additional error details
   */
  constructor(
    message,
    status,
    validationErrors = null,
    errorCode = null,
    errorDetails = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.validationErrors = validationErrors;
    this.errorCode = errorCode;
    this.errorDetails = errorDetails;
  }

  /**
   * Check if this is a validation error (400 with field errors)
   */
  get isValidationError() {
    return this.status === 400 && this.validationErrors !== null;
  }

  /**
   * Check if this is an authentication error
   */
  get isAuthError() {
    return this.status === 401 || this.status === 403 || this.status === 423;
  }

  /**
   * Check if this is a rate limit error
   */
  get isRateLimitError() {
    return this.status === 429;
  }

  /**
   * Check if this is a server error
   */
  get isServerError() {
    return this.status >= 500;
  }

  /**
   * Check if this is a network error
   */
  get isNetworkError() {
    return this.status === 0;
  }

  /**
   * Get field errors for a specific source (body, query, params)
   * @param {'body'|'query'|'params'} source
   * @returns {object|null}
   */
  getFieldErrors(source) {
    return this.validationErrors?.[source] ?? null;
  }

  /**
   * Get all field errors flattened
   * @returns {Record<string, string[]>}
   */
  getAllFieldErrors() {
    if (!this.validationErrors) return {};
    const all = {};
    for (const [source, fields] of Object.entries(this.validationErrors)) {
      for (const [field, messages] of Object.entries(fields)) {
        const key = `${source}.${field}`;
        all[key] = Array.isArray(messages) ? messages : [messages];
      }
    }
    return all;
  }

  /**
   * Get first error message for display
   * @returns {string}
   */
  getFirstErrorMessage() {
    const all = this.getAllFieldErrors();
    const firstKey = Object.keys(all)[0];
    return firstKey ? all[firstKey][0] : this.message;
  }

  /**
   * Get user-friendly error message based on error code
   * @returns {string}
   */
  getUserFriendlyMessage() {
    if (!this.errorCode) return this.message;

    const friendlyMessages = {
      // Auth errors
      "AUTH.INVALID_CREDENTIALS": "Invalid username or password",
      "AUTH.TOKEN_EXPIRED": "Your session has expired. Please login again.",
      "AUTH.TOKEN_INVALID": "Invalid session. Please login again.",
      "AUTH.ACCOUNT_LOCKED":
        "Account temporarily locked. Please try again later.",
      "AUTH.ACCOUNT_DISABLED": "This account has been disabled.",
      "AUTH.MFA_REQUIRED": "Two-factor authentication is required",
      "AUTH.MFA_INVALID": "Invalid authentication code",

      // Validation errors
      "VALIDATION.FAILED": "Please check your input and try again",
      "VALIDATION.REQUIRED_FIELD": "Required field is missing",
      "VALIDATION.INVALID_EMAIL": "Please enter a valid email address",
      "VALIDATION.INVALID_PASSWORD": "Password does not meet requirements",
      "VALIDATION.PASSWORD_WEAK": "Password is too weak",
      "VALIDATION.PASSWORD_REUSED":
        "Password was recently used. Please choose a different one.",

      // Resource errors
      "RESOURCE.NOT_FOUND": "The requested resource was not found",
      "RESOURCE.ALREADY_EXISTS": "This resource already exists",
      "RESOURCE.CONFLICT": "Conflict with existing resource",

      // Business errors
      "BUSINESS.BOOKING_CONFLICT": "Booking conflict with existing reservation",
      "BUSINESS.ROOM_UNAVAILABLE":
        "Room is not available for the selected dates",

      // External errors
      "EXTERNAL.PAYMENT_FAILED": "Payment processing failed. Please try again.",
      "EXTERNAL.SERVICE_UNAVAILABLE": "Service temporarily unavailable",

      // Rate limit
      "RATE_LIMIT.EXCEEDED": "Too many requests. Please slow down.",

      // File errors
      "FILE.TOO_LARGE": "File size exceeds the maximum allowed",
      "FILE.INVALID_TYPE": "File type not supported",
    };

    return friendlyMessages[this.errorCode] || this.message;
  }
}

/**
 * Base fetch wrapper handling authentication headers, query parameters,
 * timeouts, JSON parsing, and 401 redirection events.
 *
 * @param {string} path - Request endpoint path relative to API_URL
 * @param {object} [options] - Fetch configuration options
 * @param {string} [options.method='GET'] - HTTP request method
 * @param {*} [options.body] - Request payload
 * @param {boolean} [options.auth=false] - Whether to attach Authorization token
 * @param {object} [options.headers] - Additional HTTP headers
 * @param {object} [options.query] - Query parameters
 * @param {object} [options.params] - Alias for query parameters
 * @param {string} [options.credentials='include'] - Credentials mode
 * @param {number} [options.timeout=30000] - Request timeout in milliseconds
 * @param {string} [options.responseType='json'] - Expected response type ('json', 'blob', 'text')
 * @param {AbortSignal} [options.signal] - Optional abort signal
 * @returns {Promise<any>} Parsed response data
 */
export async function apiFetch(
  path,
  {
    method = "GET",
    body,
    auth = false,
    headers = {},
    query,
    params,
    credentials = "include",
    timeout = 30000,
    signal,
    responseType = "json",
  } = {},
) {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  const finalSignal = signal || controller.signal;

  const url = new URL(path, API_URL);

  const queryParams = query || params;
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const defaultAccept = responseType === "blob" ? "*/*" : "application/json";
  const requestHeaders = {
    Accept: defaultAccept,
    ...headers,
  };

  // Add correlation ID if available (only in browser environment)
  const isBrowser =
    typeof window !== "undefined" && typeof localStorage !== "undefined";
  const correlationId = isBrowser
    ? localStorage.getItem("hotelos_correlation_id")
    : null;
  if (correlationId) {
    requestHeaders["x-correlation-id"] = correlationId;
  }

  const isJsonBody =
    body !== undefined && body !== null && !(body instanceof FormData);

  if (isJsonBody) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = isBrowser ? localStorage.getItem("auth_token") : null;

    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  let response;

  try {
    const fetchOptions = {
      method,
      headers: requestHeaders,
      signal: finalSignal,
      credentials,
    };
    if (body !== undefined && method !== "GET") {
      fetchOptions.body =
        body instanceof FormData ? body : JSON.stringify(body);
    }
    response = await fetch(url, fetchOptions);
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

  if (
    response.ok &&
    (responseType === "blob" ||
      contentType.includes("application/pdf") ||
      contentType.includes("application/octet-stream"))
  ) {
    data = await response.blob();
  } else if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      throw new ApiError("Invalid JSON response from server.", response.status);
    }
  } else {
    data = await response.text();
  }

  if (response.status === 401) {
    const hadToken = isBrowser ? !!localStorage.getItem("auth_token") : false;
    if (isBrowser) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    }

    if (hadToken && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hotelos:unauthorized"));
    }

    throw new ApiError(
      data?.message || "Session expired. Please login again.",
      401,
    );
  }

  if (!response.ok) {
    // Extract validation errors from new standardized format
    const validationErrors = data?.errors ?? null;

    // Extract standardized error code and details
    const errorCode = data?.error?.code ?? null;
    const errorDetails = data?.error?.details ?? null;

    const message =
      data?.message ||
      data?.error?.message ||
      `Request failed (${response.status})`;

    throw new ApiError(
      message,
      response.status,
      validationErrors,
      errorCode,
      errorDetails,
    );
  }

  return data;
}

/**
 * Convenience HTTP client methods with pre-configured request verbs.
 */
export const api = {
  /**
   * Performs a GET request.
   * @param {string} url - Request URL or path
   * @param {object} [options] - Request options
   * @returns {Promise<any>}
   */
  get: (url, options) => apiFetch(url, { ...options, method: "GET" }),

  /**
   * Performs a POST request.
   * @param {string} url - Request URL or path
   * @param {*} [body] - Request body
   * @param {object} [options] - Request options
   * @returns {Promise<any>}
   */
  post: (url, body, options) =>
    apiFetch(url, {
      ...options,
      method: "POST",
      body,
    }),

  /**
   * Performs a PUT request.
   * @param {string} url - Request URL or path
   * @param {*} [body] - Request body
   * @param {object} [options] - Request options
   * @returns {Promise<any>}
   */
  put: (url, body, options) =>
    apiFetch(url, {
      ...options,
      method: "PUT",
      body,
    }),

  /**
   * Performs a PATCH request.
   * @param {string} url - Request URL or path
   * @param {*} [body] - Request body
   * @param {object} [options] - Request options
   * @returns {Promise<any>}
   */
  patch: (url, body, options) =>
    apiFetch(url, {
      ...options,
      method: "PATCH",
      body,
    }),

  /**
   * Performs a DELETE request.
   * @param {string} url - Request URL or path
   * @param {object} [options] - Request options
   * @returns {Promise<any>}
   */
  delete: (url, options) =>
    apiFetch(url, {
      ...options,
      method: "DELETE",
    }),

  /**
   * Performs a GET request expecting a binary Blob response.
   * @param {string} url - Request URL or path
   * @param {object} [options] - Request options
   * @returns {Promise<Blob>}
   */
  blob: (url, options) =>
    apiFetch(url, {
      ...options,
      method: "GET",
      responseType: "blob",
    }),
};
