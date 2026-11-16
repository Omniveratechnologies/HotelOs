import { app, BrowserWindow, Menu, protocol } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerAllIpc } from "./ipc/index.ts";
import { registerAppProtocol } from "./window/protocol.ts";
import { createMainWindow } from "./window/window.ts";

export * from "./services/printer.service.ts";
export * from "./services/usb.service.ts";
export * from "./services/file.service.ts";
export * from "./services/power.service.ts";
export * from "./services/notification.service.ts";
export * from "./ipc/index.ts";
export * from "./window/protocol.ts";
export * from "./window/window.ts";

export const currentModuleDir = path.dirname(fileURLToPath(import.meta.url));

export interface InitElectronAppOptions {
  title: string;
  defaultPort: number;
  preloadPath?: string;
  rendererDir?: string;
  onWindowCreated?: (window: BrowserWindow) => void;
}

export function initElectronApp(options: InitElectronAppOptions): void {
  const isDev =
    Boolean(process.env["ELECTRON_RENDERER_URL"]) ||
    process.env["NODE_ENV"] === "development";

  protocol.registerSchemesAsPrivileged([
    {
      scheme: "app",
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true,
      },
    },
  ]);

  let mainWindow: BrowserWindow | null = null;

  function createWindow(): void {
    const defaultPreload = path.join(app.getAppPath(), "out/preload/index.mjs");
    const preloadPath = options.preloadPath || defaultPreload;

    mainWindow = createMainWindow({
      title: options.title,
      defaultPort: options.defaultPort,
      preloadPath,
    });

    registerAllIpc(mainWindow);

    if (options.onWindowCreated) {
      options.onWindowCreated(mainWindow);
    }

    mainWindow.on("closed", () => {
      mainWindow = null;
    });
  }

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);

    if (!isDev) {
      const defaultRendererDir = path.join(app.getAppPath(), "out/renderer");
      registerAppProtocol(options.rendererDir || defaultRendererDir);
    }

    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}
