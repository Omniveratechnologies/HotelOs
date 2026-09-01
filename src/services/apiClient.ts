import { API_BASE_URL } from "@/config/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  return localStorage.getItem("hotelos_token");
}

function handleUnauthorized() {
  localStorage.removeItem("hotelos_token");
  localStorage.removeItem("hotelos_user");
  // Full reload forces AuthContext to re-check localStorage and show LoginPage
  window.location.href = "/";
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    handleUnauthorized();
    throw new ApiError("Session expired — please log in again", 401);
  }

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new ApiError(json.message || "Request failed", res.status);
  }

  return json.data as T;
}