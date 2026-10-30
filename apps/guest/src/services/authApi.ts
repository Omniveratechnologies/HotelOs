import { apiRequest } from "./apiClient";

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    username: string;
    role: string;
    hotelId: string;
    hotelName?: string | null;
    roomId: string | null;
    bookingStatus?: string;
    reservationNo?: string | null;
    mustChangePassword: boolean;
  };
}

export interface KioskExchangeResponse {
  token: string;
  csrfToken: string;
  sessionType: string;
  hotelId: string;
  hotelName: string;
  kioskId: string;
  deviceId: string;
  tableId: string | null;
  roomId: string | null;
  roomNumber: string | null;
  roomType: string | null;
  targetDashboard: string;
  activeStay: boolean;
  guestToken: string | null;
  user: {
    id: string;
    name: string;
    username: string;
    role: string;
    hotelId: string;
    roomId: string | null;
    mustChangePassword: boolean;
  } | null;
  reservationNo: string | null;
  expiresAt: string;
}

export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function logout(): Promise<void> {
  await apiRequest("/auth/logout", { method: "POST" });
}

export async function exchangeKioskHandoff(
  handoffCode: string,
): Promise<KioskExchangeResponse> {
  return apiRequest<KioskExchangeResponse>("/sessions/kiosk-exchange", {
    method: "POST",
    body: JSON.stringify({ handoffCode }),
  });
}
