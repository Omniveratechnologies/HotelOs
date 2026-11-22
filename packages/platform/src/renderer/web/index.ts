import type { PlatformAPI } from "../../types/index.ts";
import { webPrinter } from "./printer.ts";
import { webHardware } from "./hardware.ts";
import { webFile } from "./file.ts";
import { webWindow } from "./window.ts";
import { webNotification } from "./notification.ts";
import { webSystem } from "./system.ts";

export const webPlatform: PlatformAPI = {
  platform: "web",
  isDesktop: false,
  isWeb: true,
  printer: webPrinter,
  hardware: webHardware,
  file: webFile,
  window: webWindow,
  notification: webNotification,
  system: webSystem,

  // Legacy compatibility helpers
  async print(): Promise<void> {
    await webPrinter.print();
  },
  async openExternal(url: string): Promise<boolean> {
    return webSystem.openExternal(url);
  },
  async openFile(): Promise<string | null> {
    return webFile.openFile();
  },
  async getAppVersion(): Promise<string> {
    return webSystem.getVersion();
  },
};
