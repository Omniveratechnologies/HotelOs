import { ipcMain } from "electron";
import { notificationService } from "../services/notification.service.ts";
import type { NotificationOptions } from "../../types/index.ts";

export function registerNotificationIpc(): void {
  ipcMain.handle(
    "desktop:notification:showNotification",
    async (_event, options: NotificationOptions) => {
      return notificationService.showNotification(options);
    },
  );
}
