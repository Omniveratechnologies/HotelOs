import { contextBridge, ipcRenderer } from "electron";
import type { PlatformAPI } from "../src/platform/types.ts";

const desktopAPI: PlatformAPI = {
  platform: "electron",
  isDesktop: true,
  print: () => ipcRenderer.invoke("desktop:print"),
  openExternal: (url: string) =>
    ipcRenderer.invoke("desktop:openExternal", url),
  openFile: () => ipcRenderer.invoke("desktop:openFile"),
  getAppVersion: () => ipcRenderer.invoke("desktop:getAppVersion"),
};

contextBridge.exposeInMainWorld("desktop", desktopAPI);
