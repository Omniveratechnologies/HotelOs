/**
 * kiosk-manager Expo Module — JS surface.
 *
 * This is the ONLY file the rest of the app imports from. It loads the
 * native module by name via expo-modules-core and exposes a typed,
 * promise-based API. On platforms without a native implementation (e.g.
 * running in Expo Go, or on iOS in this Android-focused POC) it falls back
 * to a safe no-op implementation so the JS layer never crashes.
 */
import { requireNativeModule } from "expo-modules-core";
import { Platform } from "react-native";
import type { KioskManagerModuleType } from "@/types";

let nativeModule: KioskManagerModuleType | null = null;

if (Platform.OS === "android") {
  try {
    // "KioskManager" must match the `Name("KioskManager")` declared in the
    // Kotlin module definition (android/.../KioskManagerModule.kt).
    nativeModule = requireNativeModule<KioskManagerModuleType>("KioskManager");
  } catch (err) {
    console.warn(
      "[kiosk-manager] native module not found — did you run a Development " +
        "Build (expo run:android) instead of Expo Go?",
      err,
    );
  }
}

/** Fallback used in Expo Go / iOS / when the native module fails to load. */
const fallback: KioskManagerModuleType = {
  async startKioskMode() {
    console.warn(
      "[kiosk-manager] startKioskMode() — native module unavailable, no-op",
    );
    return false;
  },
  async stopKioskMode() {
    console.warn(
      "[kiosk-manager] stopKioskMode() — native module unavailable, no-op",
    );
    return false;
  },
  async isKioskModeEnabled() {
    return false;
  },
  async isDeviceOwner() {
    return false;
  },
  async consumeLaunchedFromBoot() {
    return false;
  },
  async getDeviceId() {
    // Stable-for-session fallback id so the UI still has something to show.
    return "SIMULATED-DEVICE-ID";
  },
};

const KioskManager: KioskManagerModuleType = nativeModule ?? fallback;

export default KioskManager;
export const startKioskMode = () => KioskManager.startKioskMode();
export const stopKioskMode = () => KioskManager.stopKioskMode();
export const isKioskModeEnabled = () => KioskManager.isKioskModeEnabled();
export const isDeviceOwner = () => KioskManager.isDeviceOwner();
export const consumeLaunchedFromBoot = () =>
  KioskManager.consumeLaunchedFromBoot();
export const getDeviceId = () => KioskManager.getDeviceId();
