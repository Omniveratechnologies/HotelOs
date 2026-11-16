import type { NotificationOptions } from "../../types/index.ts";

export const webNotification = {
  async showNotification(options: NotificationOptions): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }

    try {
      let permission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }

      if (permission === "granted") {
        new Notification(options.title, {
          body: options.body,
          icon: options.icon,
          silent: options.silent,
        });
        return true;
      }
      return false;
    } catch (err) {
      console.warn("[WebNotification] Notification error:", err);
      return false;
    }
  },
};
