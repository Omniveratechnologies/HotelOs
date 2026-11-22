import type { PlatformAPI } from "../../types/index.ts";
import { desktopPrinter } from "./printer.ts";
import { desktopHardware } from "./hardware.ts";
import { desktopFile } from "./file.ts";
import { desktopWindow } from "./window.ts";
import { desktopNotification } from "./notification.ts";
import { desktopSystem } from "./system.ts";

export const desktopPlatform: PlatformAPI = {
  platform: "electron",
  isDesktop: true,
  isWeb: false,
  printer: desktopPrinter,
  hardware: desktopHardware,
  file: desktopFile,
  window: desktopWindow,
  notification: desktopNotification,
  system: desktopSystem,

  // Legacy compatibility helpers
  async print(): Promise<void> {
    await desktopPrinter.print();
  },
  async openExternal(url: string): Promise<boolean> {
    return desktopSystem.openExternal(url);
  },
  async openFile(): Promise<string | null> {
    return desktopFile.openFile();
  },
  async getAppVersion(): Promise<string> {
    return desktopSystem.getVersion();
  },
};
