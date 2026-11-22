import {
  app,
  BrowserWindow,
  Menu,
  protocol,
  net,
  ipcMain,
  shell,
  dialog,
} from "electron";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
const isDev = !app.isPackaged && process.env.NODE_ENV === "development";

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

function setupProtocol(): void {
  const distDir = path.resolve(currentDir, "../dist");

  protocol.handle("app", (request) => {
    const url = new URL(request.url);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.startsWith("/")) {
      pathname = pathname.slice(1);
    }
    const filePath = path.join(distDir, pathname);

    if (pathname && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return net.fetch(pathToFileURL(filePath).toString());
    }

    return net.fetch(
      pathToFileURL(path.join(distDir, "index.html")).toString(),
    );
  });
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: "HotelOS Receptionist",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(currentDir, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.setMenu(null);

  if (isDev) {
    const port = process.env.PORT || "5175";
    const devServerUrl =
      process.env.VITE_DEV_SERVER_URL ||
      process.env.VITE_FRONTEND_URL ||
      `http://localhost:${port}`;
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadURL("app://localhost/");
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (
      url.startsWith("http:") ||
      url.startsWith("https:") ||
      url.startsWith("mailto:")
    ) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

ipcMain.handle("desktop:getAppVersion", () => app.getVersion());

ipcMain.handle("desktop:openExternal", async (_event, url: unknown) => {
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
});

ipcMain.handle("desktop:print", async () => {
  if (!mainWindow) return;
  mainWindow.webContents.print({ silent: false, printBackground: true });
});

ipcMain.handle("desktop:openFile", async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  if (!isDev) {
    setupProtocol();
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
