import type { SystemInfo } from "../../types/index.ts";
import { webSystem } from "../web/system.ts";

export const desktopSystem = {
  async getInfo(): Promise<SystemInfo> {
    if (typeof window !== "undefined" && window.desktop?.system?.getInfo) {
      return window.desktop.system.getInfo();
    }
    return webSystem.getInfo();
  },

  async getVersion(): Promise<string> {
    if (typeof window !== "undefined" && window.desktop?.system?.getVersion) {
      return window.desktop.system.getVersion();
    }
    return webSystem.getVersion();
  },

  async openExternal(url: string): Promise<boolean> {
    if (typeof window !== "undefined" && window.desktop?.system?.openExternal) {
      return window.desktop.system.openExternal(url);
    }
    return webSystem.openExternal(url);
  },
};
