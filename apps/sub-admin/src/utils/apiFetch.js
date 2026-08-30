export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export async function apiFetch(
  path,
  { method = "GET", body, auth = false } = {},
) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = localStorage.getItem("auth_token");

    if (!token) {
      throw new Error("You are not logged in. Please login again.");
    }

    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,

      headers,

      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "Unable to reach the server. Please check your connection.",
    );
  }

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("Invalid response from the server.");
  }

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Request failed");
  }

  return result;
}
