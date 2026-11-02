/**
 * Storage abstraction layer for HotelOS Kiosk.
 * Persists one-time physical pairing credentials, server URL, device settings,
 * and current assigned URL.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_DEVICE_SETTINGS,
  DeviceSettings,
  KioskAuthData,
} from "@/types";

const KEYS = {
  KIOSK_AUTH: "kiosk:authData",
  DEVICE_SETTINGS: "kiosk:deviceSettings",
  ASSIGNED_URL: "kiosk:assignedUrl",
  SERVER_URL: "kiosk:serverUrl",
} as const;

async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[storage] failed to read "${key}"`, err);
    return null;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[storage] failed to write "${key}"`, err);
    throw err;
  }
}

export const kioskStorage = {
  /** Get full authentication and pairing data */
  async getAuth(): Promise<KioskAuthData | null> {
    return readJson<KioskAuthData>(KEYS.KIOSK_AUTH);
  },

  /** Persist one-time physical pairing data and device token */
  async setAuth(data: KioskAuthData): Promise<void> {
    await writeJson(KEYS.KIOSK_AUTH, data);
    await AsyncStorage.setItem(KEYS.ASSIGNED_URL, data.assignedUrl);
    await AsyncStorage.setItem(KEYS.SERVER_URL, data.serverUrl);
  },

  /** Update assigned URL and target dashboard remotely without resetting credentials */
  async updateAssignedConfig(
    assignedUrl: string,
    targetDashboard?: string,
    hotelId?: string,
  ): Promise<void> {
    const current = await readJson<KioskAuthData>(KEYS.KIOSK_AUTH);
    if (current) {
      current.assignedUrl = assignedUrl;
      if (targetDashboard) current.targetDashboard = targetDashboard;
      if (hotelId) current.hotelId = hotelId;
      await writeJson(KEYS.KIOSK_AUTH, current);
    }
    await AsyncStorage.setItem(KEYS.ASSIGNED_URL, assignedUrl);
  },

  /** Clear pairing data (unpair terminal) */
  async clearAuth(): Promise<void> {
    await AsyncStorage.multiRemove([KEYS.KIOSK_AUTH, KEYS.ASSIGNED_URL]);
  },

  /** Check if device is paired and has a valid token */
  async isPaired(): Promise<boolean> {
    const auth = await readJson<KioskAuthData>(KEYS.KIOSK_AUTH);
    return Boolean(auth?.token && auth?.assignedUrl);
  },
};

export const assignedUrlStorage = {
  async get(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.ASSIGNED_URL);
  },
  async set(url: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.ASSIGNED_URL, url);
  },
};

export const serverUrlStorage = {
  async get(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.SERVER_URL);
  },
  async set(url: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.SERVER_URL, url);
  },
};

export const settingsStorage = {
  async get(): Promise<DeviceSettings> {
    const stored = await readJson<DeviceSettings>(KEYS.DEVICE_SETTINGS);
    return { ...DEFAULT_DEVICE_SETTINGS, ...stored };
  },
  async set(settings: DeviceSettings): Promise<void> {
    await writeJson(KEYS.DEVICE_SETTINGS, settings);
  },
  async update(partial: Partial<DeviceSettings>): Promise<DeviceSettings> {
    const current = await settingsStorage.get();
    const next = { ...current, ...partial };
    await settingsStorage.set(next);
    return next;
  },
};

/** Used by boot receiver flow to auto-enter kiosk mode */
export async function isPairedAndKioskEligible(): Promise<boolean> {
  const [isPaired, settings] = await Promise.all([
    kioskStorage.isPaired(),
    settingsStorage.get(),
  ]);
  return isPaired && settings.autoStartKiosk;
}
