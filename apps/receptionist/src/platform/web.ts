import type { PlatformAPI } from "./types.ts";

export const webPlatformAPI: PlatformAPI = {
  platform: "web",
  isDesktop: false,

  async print(): Promise<void> {
    window.print();
  },

  async openExternal(url: string): Promise<boolean> {
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  },

  async openFile(): Promise<string | null> {
    return null;
  },

  async getAppVersion(): Promise<string> {
    return "Web";
  },
};
