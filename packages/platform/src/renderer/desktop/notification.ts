import type { NotificationOptions } from "../../types/index.ts";
import { webNotification } from "../web/notification.ts";

export const desktopNotification = {
  async showNotification(options: NotificationOptions): Promise<boolean> {
    if (
      typeof window !== "undefined" &&
      window.desktop?.notification?.showNotification
    ) {
      return window.desktop.notification.showNotification(options);
    }
    return webNotification.showNotification(options);
  },
};
