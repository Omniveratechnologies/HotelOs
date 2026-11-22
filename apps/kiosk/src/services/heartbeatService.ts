/**
 * Heartbeat service.
 *
 * Every intervalMs (default 30s) collects deviceId, battery level, app version
 * and a timestamp, then POSTs it to the HotelOS backend.
 * Checks response to keep assignedUrl and targetDashboard in sync.
 */
import * as Application from "expo-application";
import * as Battery from "expo-battery";
import { kioskApi } from "@/services/kioskApi";
import { kioskStorage } from "@/lib/storage";
import { HeartbeatPayload, HeartbeatResponsePayload } from "@/types";
import { getDeviceId } from "@modules/kiosk-manager";

export type HeartbeatListener = (payload: HeartbeatPayload) => void;
export type ConfigSyncListener = (
  config: HeartbeatResponsePayload["data"],
) => void;

export class HeartbeatService {
  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<HeartbeatListener>();
  private configListeners = new Set<ConfigSyncListener>();

  isRunning(): boolean {
    return this.timer !== null;
  }

  onTick(listener: HeartbeatListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onConfigSync(listener: ConfigSyncListener): () => void {
    this.configListeners.add(listener);
    return () => this.configListeners.delete(listener);
  }

  start(intervalMs: number): void {
    if (this.timer) return; // already running
    this.tick(); // fire immediately, then on interval
    this.timer = setInterval(() => this.tick(), intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Forces an immediate heartbeat tick to synchronize with the server
   * on socket reconnection, network restore, or app wake.
   */
  async pulse(): Promise<void> {
    await this.tick();
  }

  private async tick(): Promise<void> {
    try {
      const auth = await kioskStorage.getAuth();
      if (!auth?.token || !auth?.serverUrl) {
        return;
      }

      const [deviceId, batteryLevel] = await Promise.all([
        getDeviceId(),
        Battery.getBatteryLevelAsync().catch(() => 1.0),
      ]);

      const payload: HeartbeatPayload = {
        deviceId,
        batteryLevel:
          typeof batteryLevel === "number" && !isNaN(batteryLevel)
            ? batteryLevel
            : 1.0,
        appVersion: Application.nativeApplicationVersion ?? "1.0.0",
        timestamp: new Date().toISOString(),
      };

      const res = await kioskApi.sendHeartbeat(
        auth.serverUrl,
        auth.token,
        payload,
      );
      this.listeners.forEach((listener) => listener(payload));

      if (res.data) {
        if (res.data.assignedUrl && res.data.assignedUrl !== auth.assignedUrl) {
          await kioskStorage.updateAssignedConfig(
            res.data.assignedUrl,
            res.data.targetDashboard,
          );
        }
        this.configListeners.forEach((listener) => listener(res.data));
      }
    } catch (err) {
      console.warn("[heartbeatService] tick failed", err);
    }
  }
}

export const heartbeatService = new HeartbeatService();
