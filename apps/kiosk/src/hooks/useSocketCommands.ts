/**
 * useSocketCommands
 *
 * Connects to HotelOS backend Socket.IO channel using kiosk JWT token and
 * dispatches server-pushed commands (device:reload / device:navigate /
 * device:restart / device:exit-kiosk / device:config-updated).
 */
import { useEffect } from "react";
import { socketService } from "@/services/socketService";
import { NavigateCommandPayload, RemoteCommand } from "@/types";

export interface SocketCommandHandlers {
  onReload?: () => void;
  onNavigate?: (payload: NavigateCommandPayload) => void;
  onRestart?: () => void;
  onExitKiosk?: () => void;
  onConfigUpdated?: (payload: {
    status?: "ONLINE" | "MAINTENANCE" | "DISABLED";
    assignedUrl?: string;
    targetDashboard?: string;
  }) => void;
}

export function useSocketCommands(
  serverUrl: string | null,
  token: string | null,
  deviceId: string | null,
  active: boolean,
  handlers: SocketCommandHandlers,
) {
  useEffect(() => {
    if (!active || !serverUrl || !token || !deviceId) return;

    socketService.connect(serverUrl, token, deviceId);
    const unsubscribe = socketService.onCommand((command: RemoteCommand) => {
      switch (command.type) {
        case "device:reload":
          handlers.onReload?.();
          break;
        case "device:navigate":
          handlers.onNavigate?.(command.payload as NavigateCommandPayload);
          break;
        case "device:restart":
          handlers.onRestart?.();
          break;
        case "device:exit-kiosk":
          handlers.onExitKiosk?.();
          break;
        case "device:config-updated":
          handlers.onConfigUpdated?.(
            command.payload as {
              status?: "ONLINE" | "MAINTENANCE" | "DISABLED";
              assignedUrl?: string;
              targetDashboard?: string;
            },
          );
          break;
      }
    });

    return () => {
      unsubscribe();
      socketService.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, serverUrl, token, deviceId]);
}
