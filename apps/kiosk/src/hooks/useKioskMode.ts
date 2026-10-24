/**
 * useKioskMode
 *
 * Thin React wrapper around the kiosk-manager native module: exposes
 * current enabled state plus enter()/exit() actions, and keeps state in
 * sync after each call.
 *
 * Kiosk mode requires the app to be provisioned as Device Owner. If it
 * isn't, enter() fails and `error` carries a message (including the exact
 * `adb shell dpm set-device-owner ...` command) instead of silently falling
 * back to escapable screen pinning. `deviceOwner` reflects that state.
 */
import { useCallback, useEffect, useState } from "react";
import {
  isDeviceOwner as queryIsDeviceOwner,
  isKioskModeEnabled,
  startKioskMode,
  stopKioskMode,
} from "@modules/kiosk-manager";

export function useKioskMode() {
  const [enabled, setEnabled] = useState(false);
  const [deviceOwner, setDeviceOwner] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [isEnabled, isOwner] = await Promise.all([
      isKioskModeEnabled(),
      queryIsDeviceOwner(),
    ]);
    setEnabled(isEnabled);
    setDeviceOwner(isOwner);
  }, []);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    refresh();
  }, [refresh]);

  const enter = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const started = await startKioskMode();
      if (!started) {
        setError(
          "Kiosk mode is unavailable — the native kiosk module did not start.",
        );
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      await refresh();
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const exit = useCallback(async () => {
    setBusy(true);
    try {
      await stopKioskMode();
      await refresh();
    } finally {
      setBusy(false);
    }
    // oxlint-disable-next-line react/memo-dependencies
  }, [refresh]);

  return { enabled, deviceOwner, busy, error, enter, exit, refresh };
}
