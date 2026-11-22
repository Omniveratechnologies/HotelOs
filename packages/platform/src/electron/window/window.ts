import {
  BrowserWindow,
  shell,
  type BrowserWindowConstructorOptions,
} from "electron";

export interface MainWindowOptions {
  title: string;
  preloadPath: string;
  defaultPort: number;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  devServerUrl?: string;
  customOptions?: BrowserWindowConstructorOptions;
}

export function createMainWindow(options: MainWindowOptions): BrowserWindow {
  const isDev =
    Boolean(process.env["ELECTRON_RENDERER_URL"]) ||
    process.env["NODE_ENV"] === "development";

  const win = new BrowserWindow({
    width: options.width ?? 1280,
    height: options.height ?? 800,
    minWidth: options.minWidth ?? 1024,
    minHeight: options.minHeight ?? 700,
    title: options.title,
    autoHideMenuBar: true,
    webPreferences: {
      preload: options.preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    ...options.customOptions,
  });

  win.setMenu(null);

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url === "about:blank" || url === "" || url.startsWith("about:")) {
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          autoHideMenuBar: true,
        },
      };
    }
    if (
      url.startsWith("http:") ||
      url.startsWith("https:") ||
      url.startsWith("mailto:")
    ) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  if (isDev) {
    const devUrl =
      process.env["ELECTRON_RENDERER_URL"] ||
      options.devServerUrl ||
      `http://localhost:${options.defaultPort}`;
    win.loadURL(devUrl);
  } else {
    win.loadURL("app://localhost/");
  }

  return win;
}
