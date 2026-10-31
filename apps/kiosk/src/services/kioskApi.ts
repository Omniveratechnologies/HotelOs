/**
 * Real HotelOS Backend API Service for Kiosk Terminals.
 */
import {
  HeartbeatPayload,
  HeartbeatResponsePayload,
  PairingRequestPayload,
  PairingResponsePayload,
} from "@/types";

function cleanUrl(baseUrl: string, endpoint: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  const path = endpoint.replace(/^\/+/, "");
  return `${base}/${path}`;
}

export interface KioskStatusApiResponse {
  success: boolean;
  data: {
    id?: string;
    deviceId?: string;
    name?: string;
    status: "ONLINE" | "MAINTENANCE" | "DISABLED";
    targetDashboard?: string;
    assignedUrl?: string;
  };
}

export const kioskApi = {
  /**
   * One-time pairing against POST /api/v1/kiosks/pair
   */
  async pairDevice(
    serverUrl: string,
    payload: PairingRequestPayload,
  ): Promise<PairingResponsePayload> {
    const url = cleanUrl(serverUrl, "/api/v1/kiosks/pair");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Pairing failed (HTTP ${res.status})`);
    }

    return data;
  },

  /**
   * Periodic heartbeat against POST /api/v1/kiosks/heartbeat
   */
  async sendHeartbeat(
    serverUrl: string,
    token: string,
    payload: HeartbeatPayload,
  ): Promise<HeartbeatResponsePayload> {
    const url = cleanUrl(serverUrl, "/api/v1/kiosks/heartbeat");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Heartbeat failed (HTTP ${res.status})`);
    }

    return data;
  },

  /**
   * Terminal status fetch against GET /api/v1/kiosks/status
   */
  async getStatus(
    serverUrl: string,
    token: string,
  ): Promise<KioskStatusApiResponse> {
    const url = cleanUrl(serverUrl, "/api/v1/kiosks/status");

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        data.message || `Status fetch failed (HTTP ${res.status})`,
      );
    }

    return data;
  },
};
