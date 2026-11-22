import { webWindow } from "../web/window.ts";

export const desktopWindow = {
  async keepAwake(enable: boolean): Promise<boolean> {
    if (typeof window !== "undefined" && window.desktop?.window?.keepAwake) {
      return window.desktop.window.keepAwake(enable);
    }
    return webWindow.keepAwake(enable);
  },

  async setFullScreen(enable: boolean): Promise<boolean> {
    if (
      typeof window !== "undefined" &&
      window.desktop?.window?.setFullScreen
    ) {
      return window.desktop.window.setFullScreen(enable);
    }
    return webWindow.setFullScreen(enable);
  },
};
