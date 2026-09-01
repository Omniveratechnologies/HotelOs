import { apiRequest } from "./apiClient";

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    username: string;
    role: string;
    hotelId: string;
    roomId: string | null;
    mustChangePassword: boolean;
  };
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function logout(): Promise<void> {
  await apiRequest("/auth/logout", { method: "POST" });
}