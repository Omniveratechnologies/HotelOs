import { Notification } from "electron";
import type { NotificationOptions } from "../../types/index.ts";

export const notificationService = {
  showNotification(options: NotificationOptions): boolean {
    try {
      if (Notification.isSupported()) {
        const notif = new Notification({
          title: options.title,
          body: options.body,
          icon: options.icon,
          silent: options.silent,
        });
        notif.show();
        return true;
      }
      return false;
    } catch (error) {
      console.error("[NotificationService] Notification error:", error);
      return false;
    }
  },
};
