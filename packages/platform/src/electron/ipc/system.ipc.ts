import { ipcMain, app, shell } from "electron";
import type { SystemInfo } from "../../types/index.ts";

export function registerSystemIpc(): void {
  ipcMain.handle("desktop:system:getInfo", async (): Promise<SystemInfo> => {
    return {
      platform: process.platform,
      arch: process.arch,
      osVersion: process.getSystemVersion?.() || process.platform,
      electronVersion: process.versions.electron,
      appVersion: app.getVersion(),
    };
  });

  ipcMain.handle("desktop:system:getVersion", async (): Promise<string> => {
    return app.getVersion();
  });

  ipcMain.handle(
    "desktop:system:openExternal",
    async (_event, url: unknown) => {
      if (
        typeof url === "string" &&
        (url.startsWith("http:") ||
          url.startsWith("https:") ||
          url.startsWith("mailto:"))
      ) {
        await shell.openExternal(url);
        return true;
      }
      return false;
    },
  );
}
