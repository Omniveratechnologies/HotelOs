import { ipcMain, type BrowserWindow } from "electron";
import { fileService } from "../services/file.service.ts";
import type { DownloadOptions } from "../../types/index.ts";

export function registerFileIpc(window: BrowserWindow): void {
  ipcMain.handle(
    "desktop:file:downloadFile",
    async (_event, options: DownloadOptions) => {
      return fileService.downloadFile(window, options);
    },
  );

  ipcMain.handle(
    "desktop:file:openFile",
    async (_event, filters?: { name: string; extensions: string[] }[]) => {
      return fileService.openFile(window, filters);
    },
  );
}
