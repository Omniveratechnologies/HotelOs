/**
 * Shared TypeScript types for the HotelOS Kiosk app.
 */

export type DeviceId = string;

/** Persisted authentication & pairing record for one-time physical setup. */
export interface KioskAuthData {
  /** Cryptographic JWT device token issued upon pairing. */
  token: string;
  /** HotelOS backend server base URL (e.g. http://10.0.2.2:5000 or production URL). */
  serverUrl: string;
  /** Terminal database ID. */
  kioskId: string;
  /** Terminal hardware ID. */
  deviceId: DeviceId;
  /** Terminal display name. */
  kioskName: string;
  /** Assigned hotel ID. */
  hotelId: string;
  /** Assigned hotel name. */
  hotelName?: string;
  /** Mode: DEMO_URL | GUEST_CHECKIN | TABLE_ORDER | RECEPTIONIST_KIOSK | CUSTOM_URL. */
  targetDashboard: string;
  /** URL currently rendered by the WebView. */
  assignedUrl: string;
  /** Timestamp when pairing was completed. */
  pairedAt: string;
}

/** Local device settings. */
export interface DeviceSettings {
  autoStartKiosk: boolean;
  heartbeatIntervalMs: number;
}

export const DEFAULT_DEVICE_SETTINGS: DeviceSettings = {
  autoStartKiosk: true,
  heartbeatIntervalMs: 30_000,
};

/** Request payload sent to POST /api/v1/kiosks/pair */
export interface PairingRequestPayload {
  pairCode: string;
  deviceId: DeviceId;
  firmwareVersion?: string;
  appVersion?: string;
  ipAddress?: string;
}

/** Response from POST /api/v1/kiosks/pair */
export interface PairingResponsePayload {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    kiosk: {
      id: string;
      deviceId: string;
      name: string;
      location?: string;
      hotelId: string;
      hotelName: string;
      targetDashboard: string;
      assignedUrl: string;
    };
  };
}

/** Request payload sent to POST /api/v1/kiosks/heartbeat */
export interface HeartbeatPayload {
  deviceId: DeviceId;
  batteryLevel: number;
  appVersion: string;
  timestamp: string;
  ipAddress?: string;
}

/** Response payload from POST /api/v1/kiosks/heartbeat */
export interface HeartbeatResponsePayload {
  success: boolean;
  message?: string;
  data?: {
    assignedUrl: string;
    targetDashboard: string;
    status: string;
  };
}

/** Remote commands pushed over WebSocket channel. */
export type RemoteCommandType =
  | "device:reload"
  | "device:navigate"
  | "device:restart"
  | "device:exit-kiosk"
  | "device:config-updated";

export interface RemoteCommand<T = unknown> {
  type: RemoteCommandType;
  payload?: T;
}

export interface NavigateCommandPayload {
  url: string;
  targetDashboard?: string;
  hotelId?: string;
}

/** Native kiosk-manager module surface. */
export interface KioskManagerModuleType {
  startKioskMode(): Promise<boolean>;
  stopKioskMode(): Promise<boolean>;
  isKioskModeEnabled(): Promise<boolean>;
  isDeviceOwner(): Promise<boolean>;
  consumeLaunchedFromBoot(): Promise<boolean>;
  getDeviceId(): Promise<string>;
}
