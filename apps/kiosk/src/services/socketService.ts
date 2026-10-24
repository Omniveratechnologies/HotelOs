/**
 * Socket.IO service for HotelOS Kiosk remote management.
 *
 * Connects with authenticated JWT device token to HotelOS backend.
 * Listens for remote commands:
 * - device:reload
 * - device:navigate (dynamic dashboard & hotel URL update)
 * - device:restart
 * - device:exit-kiosk
 * - device:config-updated
 */
import { io, Socket } from "socket.io-client";
import {
  NavigateCommandPayload,
  RemoteCommand,
  RemoteCommandType,
} from "@/types";

export type RemoteCommandHandler = (command: RemoteCommand) => void;

const COMMAND_TYPES: RemoteCommandType[] = [
  "device:reload",
  "device:navigate",
  "device:restart",
  "device:exit-kiosk",
  "device:config-updated",
];

class SocketService {
  private socket: Socket | null = null;
  private handlers = new Set<RemoteCommandHandler>();
  private syncListeners = new Set<() => void>();

  connect(serverUrl: string, token: string, deviceId: string): void {
    if (this.socket?.connected) return;

    try {
      this.socket = io(serverUrl, {
        transports: ["websocket", "polling"],
        auth: { token },
        query: { deviceId },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        autoConnect: true,
      });

      COMMAND_TYPES.forEach((type) => {
        this.socket!.on(type, (payload: unknown) => {
          this.dispatch({ type, payload });
        });
      });

      this.socket.on("connect", () => {
        console.log("[socketService] Connected to HotelOS socket server");
        this.notifySync();
      });

      this.socket.on("reconnect", (attempt) => {
        console.log(
          `[socketService] Reconnected to server (attempt ${attempt})`,
        );
        this.notifySync();
      });

      this.socket.on("connect_error", (err) => {
        console.warn("[socketService] connection notice:", err.message);
      });
    } catch (err) {
      console.warn(
        "[socketService] failed to initialize socket connection",
        err,
      );
    }
  }

  onSync(callback: () => void): () => void {
    this.syncListeners.add(callback);
    return () => this.syncListeners.delete(callback);
  }

  private notifySync(): void {
    this.syncListeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.warn("[socketService] sync listener error:", err);
      }
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  onCommand(handler: RemoteCommandHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  simulateIncomingCommand(
    type: RemoteCommandType,
    payload?: NavigateCommandPayload,
  ): void {
    this.dispatch({ type, payload });
  }

  private dispatch(command: RemoteCommand): void {
    this.handlers.forEach((handler) => handler(command));
  }
}

export const socketService = new SocketService();
