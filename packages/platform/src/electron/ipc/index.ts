import type { BrowserWindow } from "electron";
import { registerPrinterIpc } from "./printer.ipc.ts";
import { registerHardwareIpc } from "./hardware.ipc.ts";
import { registerFileIpc } from "./file.ipc.ts";
import { registerWindowIpc } from "./window.ipc.ts";
import { registerNotificationIpc } from "./notification.ipc.ts";
import { registerSystemIpc } from "./system.ipc.ts";

export function registerAllIpc(window: BrowserWindow): void {
  registerPrinterIpc(window);
  registerHardwareIpc();
  registerFileIpc(window);
  registerWindowIpc(window);
  registerNotificationIpc();
  registerSystemIpc();
}

export {
  registerPrinterIpc,
  registerHardwareIpc,
  registerFileIpc,
  registerWindowIpc,
  registerNotificationIpc,
  registerSystemIpc,
};
