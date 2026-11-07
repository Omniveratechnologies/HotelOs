import type { PlatformAPI } from "./types.ts";

export const electronPlatformAPI: PlatformAPI = {
  platform: "electron",
  isDesktop: true,

  async print(): Promise<void> {
    if (typeof window !== "undefined" && window.desktop?.print) {
      await window.desktop.print();
      return;
    }
    window.print();
  },

  async openExternal(url: string): Promise<boolean> {
    if (typeof window !== "undefined" && window.desktop?.openExternal) {
      return await window.desktop.openExternal(url);
    }
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  },

  async openFile(): Promise<string | null> {
    if (typeof window !== "undefined" && window.desktop?.openFile) {
      return await window.desktop.openFile();
    }
    return null;
  },

  async getAppVersion(): Promise<string> {
    if (typeof window !== "undefined" && window.desktop?.getAppVersion) {
      return await window.desktop.getAppVersion();
    }
    return "Desktop";
  },
};
