/**
 * useHeartbeat
 *
 * Starts/stops the shared heartbeatService for the lifetime of the
 * component that calls it (typically the Kiosk WebView screen, so
 * heartbeats only run while a table is actually being displayed), and
 * surfaces the most recent payload for optional on-screen debug display.
 */
import { useEffect, useState } from "react";
import { heartbeatService } from "@/services/heartbeatService";
import { settingsStorage } from "@/lib/storage";
import { HeartbeatPayload } from "@/types";

export function useHeartbeat(active: boolean) {
  const [lastHeartbeat, setLastHeartbeat] = useState<HeartbeatPayload | null>(
    null,
  );

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    const unsubscribe = heartbeatService.onTick((payload) => {
      if (!cancelled) setLastHeartbeat(payload);
    });

    settingsStorage.get().then((settings) => {
      if (!cancelled) heartbeatService.start(settings.heartbeatIntervalMs);
    });

    return () => {
      cancelled = true;
      unsubscribe();
      heartbeatService.stop();
    };
  }, [active]);

  return { lastHeartbeat };
}
