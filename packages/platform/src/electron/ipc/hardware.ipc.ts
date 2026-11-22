import { ipcMain } from "electron";
import { usbService } from "../services/usb.service.ts";

export function registerHardwareIpc(): void {
  ipcMain.handle("desktop:hardware:listUsb", async () => {
    return usbService.listUsbDevices();
  });
}
