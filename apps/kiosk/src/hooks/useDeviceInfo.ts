/**
 * useDeviceInfo
 *
 * Loads the native device id (via kiosk-manager) plus static device/app
 * info from expo-application & expo-constants, for display on the Home
 * screen.
 */
import { useEffect, useState } from "react";
import * as Application from "expo-application";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { getDeviceId } from "@modules/kiosk-manager";

export interface DeviceInfo {
  deviceId: string | null;
  appVersion: string;
  osVersion: string;
  platform: string;
  loading: boolean;
}

export function useDeviceInfo(): DeviceInfo {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getDeviceId()
      .then((id) => {
        if (!cancelled) setDeviceId(id);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    deviceId,
    appVersion:
      Application.nativeApplicationVersion ??
      (Constants.expoConfig?.version as string) ??
      "0.0.0",
    osVersion: String(Platform.Version),
    platform: Platform.OS,
    loading,
  };
}
