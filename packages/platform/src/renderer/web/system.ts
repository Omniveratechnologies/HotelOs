import type { SystemInfo } from "../../types/index.ts";

export const webSystem = {
  async getInfo(): Promise<SystemInfo> {
    const userAgent =
      typeof navigator !== "undefined" ? navigator.userAgent : "Browser";
    return {
      platform: "web",
      arch: "unknown",
      osVersion: userAgent,
      appVersion: "Web",
    };
  },

  async getVersion(): Promise<string> {
    return "Web";
  },

  async openExternal(url: string): Promise<boolean> {
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
      return true;
    }
    return false;
  },
};
