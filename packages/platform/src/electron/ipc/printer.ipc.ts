import { ipcMain, type BrowserWindow } from "electron";
import { printerService } from "../services/printer.service.ts";
import type { PrintOptions } from "../../types/index.ts";

export function registerPrinterIpc(window: BrowserWindow): void {
  ipcMain.handle("desktop:printer:getPrinters", async () => {
    return printerService.getPrinters(window.webContents);
  });

  ipcMain.handle(
    "desktop:printer:print",
    async (_event, options?: PrintOptions) => {
      return printerService.print(window.webContents, options);
    },
  );

  ipcMain.handle(
    "desktop:printer:printRaw",
    async (_event, printerName: string, data: string | Uint8Array) => {
      return printerService.printRaw(printerName, data);
    },
  );
}
