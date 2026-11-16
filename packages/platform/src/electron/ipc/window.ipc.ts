import { ipcMain, type BrowserWindow } from "electron";
import { powerService } from "../services/power.service.ts";

export function registerWindowIpc(window: BrowserWindow): void {
  ipcMain.handle(
    "desktop:window:keepAwake",
    async (_event, enable: boolean) => {
      return powerService.keepAwake(enable);
    },
  );

  ipcMain.handle(
    "desktop:window:setFullScreen",
    async (_event, enable: boolean) => {
      window.setFullScreen(enable);
      return true;
    },
  );
}
