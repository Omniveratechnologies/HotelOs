import { contextBridge, ipcRenderer } from "electron";
import type {
  DesktopAPI,
  PrinterInfo,
  PrintOptions,
  UsbDeviceInfo,
  DownloadOptions,
  SystemInfo,
  NotificationOptions,
} from "../types/index.ts";

export function createDesktopBridge(): DesktopAPI {
  return {
    platform: "electron",
    isDesktop: true,
    isWeb: false,
    printer: {
      getPrinters: (): Promise<PrinterInfo[]> =>
        ipcRenderer.invoke("desktop:printer:getPrinters"),
      print: (
        options?: PrintOptions,
      ): Promise<{ success: boolean; failureReason?: string }> =>
        ipcRenderer.invoke("desktop:printer:print", options),
      printRaw: (
        printerName: string,
        data: string | Uint8Array,
      ): Promise<boolean> =>
        ipcRenderer.invoke("desktop:printer:printRaw", printerName, data),
    },
    hardware: {
      listUsbDevices: (): Promise<UsbDeviceInfo[]> =>
        ipcRenderer.invoke("desktop:hardware:listUsb"),
    },
    file: {
      downloadFile: (options: DownloadOptions): Promise<boolean> =>
        ipcRenderer.invoke("desktop:file:downloadFile", options),
      openFile: (
        filters?: { name: string; extensions: string[] }[],
      ): Promise<string | null> =>
        ipcRenderer.invoke("desktop:file:openFile", filters),
    },
    window: {
      keepAwake: (enable: boolean): Promise<boolean> =>
        ipcRenderer.invoke("desktop:window:keepAwake", enable),
      setFullScreen: (enable: boolean): Promise<boolean> =>
        ipcRenderer.invoke("desktop:window:setFullScreen", enable),
    },
    notification: {
      showNotification: (options: NotificationOptions): Promise<boolean> =>
        ipcRenderer.invoke("desktop:notification:showNotification", options),
    },
    system: {
      getInfo: (): Promise<SystemInfo> =>
        ipcRenderer.invoke("desktop:system:getInfo"),
      getVersion: (): Promise<string> =>
        ipcRenderer.invoke("desktop:system:getVersion"),
      openExternal: (url: string): Promise<boolean> =>
        ipcRenderer.invoke("desktop:system:openExternal", url),
    },
    // Legacy compatibility helpers
    print: (): Promise<void> =>
      ipcRenderer.invoke("desktop:printer:print").then(() => {}),
    openExternal: (url: string): Promise<boolean> =>
      ipcRenderer.invoke("desktop:system:openExternal", url),
    openFile: (): Promise<string | null> =>
      ipcRenderer.invoke("desktop:file:openFile"),
    getAppVersion: (): Promise<string> =>
      ipcRenderer.invoke("desktop:system:getVersion"),
  };
}

export function exposeDesktopBridge(): void {
  const desktop = createDesktopBridge();
  contextBridge.exposeInMainWorld("desktop", desktop);
}

export default exposeDesktopBridge;
